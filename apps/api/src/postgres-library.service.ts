/**
 * PostgreSQL-backed alpha repository. Draft and published snapshot are separate
 * relations. All mutations are serialized and committed transactionally.
 * No HTTP reader is given this repository's internal draft projection.
 */
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, type PoolClient } from 'pg';
import { type Content, type Library, type NovelNode } from '@eternalia/contracts';

type StorageRow = {
  id: string;
  kind: NovelNode['kind'];
  parent_id: string | null;
  sort_order: number;
  draft_content: Content;
  draft_revision: number;
  is_public: boolean;
  public_since: Date | null;
  updated_at: Date;
  snapshot: Content | null;
  source_draft_revision: number | null;
  published_at: Date | null;
};

const selectNodes = `
  SELECT n.id, n.kind, n.parent_id, n.sort_order, n.draft_content,
    n.draft_revision, n.is_public, n.public_since, n.updated_at,
    p.snapshot, p.source_draft_revision, p.published_at
  FROM content_nodes n
  LEFT JOIN published_snapshots p ON p.node_id = n.id
  ORDER BY n.sort_order, n.id`;

function toNode(row: StorageRow): NovelNode {
  return {
    id: row.id,
    kind: row.kind,
    parentId: row.parent_id,
    order: Number(row.sort_order),
    draft: row.draft_content,
    revision: Number(row.draft_revision),
    published: row.snapshot === null || row.source_draft_revision === null || row.published_at === null
      ? null
      : {
          value: row.snapshot,
          sourceRevision: Number(row.source_draft_revision),
          publishedAt: row.published_at.getTime(),
        },
    isPublic: row.is_public,
    publicSince: row.public_since === null ? null : row.public_since.getTime(),
    updatedAt: row.updated_at.getTime(),
  };
}

async function readFrom(client: Pool | PoolClient): Promise<Library> {
  const result = await client.query<StorageRow>(selectNodes);
  return { nodes: result.rows.map(toNode) };
}

@Injectable()
export class PostgresLibraryService implements OnModuleDestroy {
  private readonly pool: Pool | null = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
    : null;

  get enabled(): boolean { return this.pool !== null; }

  private requirePool(): Pool {
    if (!this.pool) throw new Error('DATABASE_URL is not configured');
    return this.pool;
  }

  async read(): Promise<Library> {
    return readFrom(this.requirePool());
  }

  async mutate(transform: (previous: Library) => Library): Promise<Library> {
    const client = await this.requirePool().connect();
    try {
      await client.query('BEGIN');
      // Small single-author alpha: a transaction-scoped lock serializes library writes.
      await client.query('SELECT pg_advisory_xact_lock(23141029)');
      const previous = await readFrom(client);
      const next = transform(previous);
      const before = new Map(previous.nodes.map(node => [node.id, node]));
      for (const node of next.nodes) {
        const prior = before.get(node.id);
        if (prior && JSON.stringify(prior) === JSON.stringify(node)) continue;
        await client.query(`
          INSERT INTO content_nodes (
            id,kind,parent_id,sort_order,draft_content,draft_revision,
            is_public,public_since,updated_at
          ) VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)
          ON CONFLICT (id) DO UPDATE SET
            kind=EXCLUDED.kind,parent_id=EXCLUDED.parent_id,
            sort_order=EXCLUDED.sort_order,draft_content=EXCLUDED.draft_content,
            draft_revision=EXCLUDED.draft_revision,is_public=EXCLUDED.is_public,
            public_since=EXCLUDED.public_since,updated_at=EXCLUDED.updated_at
        `, [
          node.id, node.kind, node.parentId, node.order, JSON.stringify(node.draft),
          node.revision, node.isPublic,
          node.publicSince === null ? null : new Date(node.publicSince),
          new Date(node.updatedAt),
        ]);
        if (node.published && JSON.stringify(node.published) !== JSON.stringify(prior?.published)) {
          const snapshot = node.published;
          await client.query(`
            INSERT INTO published_snapshots (node_id,source_draft_revision,snapshot,published_at)
            VALUES ($1,$2,$3::jsonb,$4)
            ON CONFLICT (node_id) DO UPDATE SET
              source_draft_revision=EXCLUDED.source_draft_revision,
              snapshot=EXCLUDED.snapshot,published_at=EXCLUDED.published_at
          `, [node.id,snapshot.sourceRevision,JSON.stringify(snapshot.value),new Date(snapshot.publishedAt)]);
        } else if (prior?.published) {
          await client.query('DELETE FROM published_snapshots WHERE node_id=$1', [node.id]);
        }
      }
      await client.query('COMMIT');
      return next;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }
}

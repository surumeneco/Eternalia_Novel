import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
  OnModuleDestroy, ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool, type PoolClient } from 'pg';

export type MasterType = 'tags' | 'classifications';
export interface MasterRow {
  id: string;
  group?: string;
  kind?: string;
  name: string;
  value?: string;
  order: number;
  revision: number;
}
type StorageRow = {
  id: string;
  group_name?: string;
  kind?: string;
  name: string;
  value?: string;
  sort_order: number;
  revision: number;
};
const masters = {
  tags: { table: 'common_master_tags', scope: 'group_name' },
  classifications: { table: 'common_master_divisions', scope: 'kind' },
} as const;
function config(type: string) {
  if (type !== 'tags' && type !== 'classifications') {
    throw new NotFoundException('マスタが見つかりません。');
  }
  return masters[type];
}
function validString(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) {
    throw new BadRequestException(label + 'を入力してください。');
  }
  return value.trim();
}
function validOrder(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0 || (value as number) > 1_000_000) {
    throw new BadRequestException('表示順は0以上1000000以下の整数です。');
  }
  return value as number;
}
function validRevision(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1) {
    throw new BadRequestException('改訂番号が不正です。');
  }
  return value as number;
}
function validId(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new BadRequestException('IDが不正です。');
  }
  return value;
}
function body(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BadRequestException('JSONオブジェクトが必要です。');
  }
  return raw as Record<string, unknown>;
}
function parse(type: MasterType, raw: unknown) {
  const data = body(raw);
  const scope = validString(type === 'tags' ? data.group : data.kind, 100,
    type === 'tags' ? 'タググループ' : '区分種別');
  const name = validString(data.name, 100, '名称');
  const order = validOrder(data.order);
  const value = type === 'classifications'
    ? (typeof data.value === 'string' && data.value.length <= 500 ? data.value : null)
    : undefined;
  if (value === null) throw new BadRequestException('区分値が不正です。');
  return { scope, name, value, order };
}
function present(type: MasterType, row: StorageRow): MasterRow {
  return {
    id: row.id,
    ...(type === 'tags' ? { group: row.group_name } : { kind: row.kind, value: row.value }),
    name: row.name, order: Number(row.sort_order), revision: Number(row.revision),
  };
}
function translateSql(error: unknown): never {
  const code = (error as { code?: string } | null)?.code;
  if (code === '23505') throw new ConflictException('同じグループ／種別に同名の項目があります。');
  if (code === '23514' || code === '22P02') throw new BadRequestException('マスタの入力が不正です。');
  throw error;
}
/** A pure CAT delete-admission judgment; never substitutes DB reference checks. */
export function deleteAdmission(revisionMatches: boolean, hasReferences: boolean):
  'allowed' | 'conflict' | 'referenced' {
  if (!revisionMatches) return 'conflict';
  return hasReferences ? 'referenced' : 'allowed';
}

@Injectable()
export class CommonMastersService implements OnModuleDestroy {
  private readonly pool: Pool | null = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, max: 4 }) : null;

  private requirePool(): Pool {
    if (!this.pool) throw new ServiceUnavailableException('PostgreSQLを設定してください。');
    return this.pool;
  }
  private async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.requirePool().connect();
    try {
      await client.query('BEGIN');
      // Serialize against content-node writes; avoid delete/write reference races.
      await client.query('SELECT pg_advisory_xact_lock(23141029)');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      return translateSql(error);
    } finally { client.release(); }
  }
  async list(type: MasterType): Promise<MasterRow[]> {
    const cfg = config(type);
    const result = await this.requirePool().query<StorageRow>(
      `SELECT * FROM ${cfg.table} ORDER BY ${cfg.scope}, sort_order, id`,
    );
    return result.rows.map(row => present(type, row));
  }
  async create(type: MasterType, raw: unknown): Promise<MasterRow> {
    const cfg = config(type);
    const entry = parse(type, raw);
    return this.transaction(async client => {
      const id = randomUUID();
      const result = await client.query<StorageRow>(
        type === 'tags'
          ? `INSERT INTO common_master_tags (id,group_name,name,sort_order)
             VALUES ($1,$2,$3,$4) RETURNING *`
          : `INSERT INTO common_master_divisions (id,kind,name,sort_order,value)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        type === 'tags'
          ? [id, entry.scope, entry.name, entry.order]
          : [id, entry.scope, entry.name, entry.order, entry.value],
      );
      return present(type, result.rows[0]!);
    });
  }
  private async rowForUpdate(client: PoolClient, type: MasterType, id: string): Promise<StorageRow> {
    const cfg = config(type);
    const result = await client.query<StorageRow>(
      `SELECT * FROM ${cfg.table} WHERE id=$1 FOR UPDATE`, [validId(id)],
    );
    if (!result.rows[0]) throw new NotFoundException('マスタ項目が見つかりません。');
    return result.rows[0];
  }
  /** All references to a tag ID, including held public snapshots and private memos. */
  private async referenced(client: PoolClient, tagId: string): Promise<boolean> {
    const result = await client.query<{ exists: boolean }>(`
      SELECT (
        EXISTS (
          SELECT 1 FROM content_nodes n WHERE n.kind='tip' AND n.deleted_at IS NULL
            AND COALESCE((n.draft_content #>> '{details,tagIds}')::jsonb, '[]'::jsonb) ? $1
        ) OR EXISTS (
          SELECT 1 FROM published_snapshots p JOIN content_nodes n ON n.id=p.node_id
          WHERE n.kind='tip' AND n.deleted_at IS NULL
            AND COALESCE((p.snapshot #>> '{details,tagIds}')::jsonb, '[]'::jsonb) ? $1
        ) OR EXISTS (
          SELECT 1 FROM author_memos m WHERE m.tags ? $1
        )
      ) AS exists`, [tagId],
    );
    return Boolean(result.rows[0]?.exists);
  }
  async edit(type: MasterType, id: string, raw: unknown): Promise<MasterRow> {
    const cfg = config(type), data = body(raw), entry = parse(type, data);
    const expectedRevision = validRevision(data.expectedRevision);
    return this.transaction(async client => {
      const prior = await this.rowForUpdate(client, type, id);
      if (prior.revision !== expectedRevision) throw new ConflictException('マスタ項目が更新されています。');
      if (type === 'tags' && prior.name !== entry.name && await this.referenced(client,id)) {
        throw new ConflictException('使用中のタグは改名できません。');
      }
      const result = await client.query<StorageRow>(
        `UPDATE ${cfg.table} SET ${cfg.scope}=$2,name=$3,sort_order=$4,
          ${type === 'tags' ? '' : 'value=$5,'} revision=revision+1,updated_at=NOW()
         WHERE id=$1 RETURNING *`,
        type === 'tags' ? [id,entry.scope,entry.name,entry.order]
          : [id,entry.scope,entry.name,entry.order,entry.value],
      );
      return present(type, result.rows[0]!);
    });
  }
  async remove(type: MasterType, id: string, expectedRevision: unknown): Promise<{ ok: true }> {
    const cfg = config(type), revision = validRevision(expectedRevision);
    await this.transaction(async client => {
      const prior = await this.rowForUpdate(client,type,id);
      const refs = type === 'tags' && await this.referenced(client,id);
      const judgment = deleteAdmission(prior.revision === revision, refs);
      if (judgment === 'conflict') throw new ConflictException('マスタ項目が更新されています。');
      if (judgment === 'referenced') throw new ConflictException('使用中のタグは削除できません。');
      await client.query(`DELETE FROM ${cfg.table} WHERE id=$1`,[id]);
    });
    return { ok: true };
  }
  async onModuleDestroy(): Promise<void> { await this.pool?.end(); }
}

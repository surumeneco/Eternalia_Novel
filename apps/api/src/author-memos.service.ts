import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
  OnModuleDestroy, ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';

export interface MemoContent { title: string; body: string; tags: string[]; }
export interface AuthorMemo extends MemoContent {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
type MemoRow = {
  id: string; title: string; body: string; tags: string[];
  revision: number; created_at: Date; updated_at: Date;
};
function project(row: MemoRow): AuthorMemo {
  return { id: row.id,title: row.title,body: row.body,tags: row.tags,
    revision: row.revision,createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString() };
}
export function validateMemo(raw: unknown): MemoContent {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new BadRequestException('メモはJSONオブジェクトで指定してください。');
  }
  const data = raw as Record<string, unknown>;
  if (typeof data.title !== 'string' || !data.title.trim() || data.title.length > 150) {
    throw new BadRequestException('メモのタイトルは1～150文字です。');
  }
  if (typeof data.body !== 'string' || data.body.length > 100_000) {
    throw new BadRequestException('メモ本文が不正です。');
  }
  if (!Array.isArray(data.tags) || data.tags.length > 30 ||
    !data.tags.every(tag => typeof tag === 'string' && !!tag.trim() && tag.length <= 50)) {
    throw new BadRequestException('タグは1～50文字、最大30件です。');
  }
  const tags = (data.tags as string[]).map(tag => tag.trim());
  if (new Set(tags).size !== tags.length) {
    throw new BadRequestException('同じタグが重複しています。');
  }
  return { title: data.title.trim(), body: data.body, tags };
}

@Injectable()
export class AuthorMemosService implements OnModuleDestroy {
  private readonly pool: Pool | null = process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, max: 3 }) : null;
  private database(): Pool {
    if (!this.pool) throw new ServiceUnavailableException('データベースが設定されていません。');
    return this.pool;
  }
  async list(): Promise<AuthorMemo[]> {
    const result = await this.database().query<MemoRow>(
      'SELECT id,title,body,tags,revision,created_at,updated_at FROM author_memos ORDER BY updated_at DESC,id'
    );
    return result.rows.map(project);
  }
  async create(input: MemoContent): Promise<AuthorMemo> {
    const memo = validateMemo(input);
    const id = randomUUID();
    const result = await this.database().query<MemoRow>(
      `INSERT INTO author_memos (id,title,body,tags) VALUES ($1,$2,$3,$4::jsonb)
       RETURNING id,title,body,tags,revision,created_at,updated_at`,
      [id,memo.title,memo.body,JSON.stringify(memo.tags)],
    );
    return project(result.rows[0]);
  }
  async edit(id: string, expectedRevision: number, input: MemoContent): Promise<AuthorMemo> {
    if (!/^[0-9a-f-]{36}$/i.test(id) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
      throw new BadRequestException('IDまたは改訂番号が不正です。');
    }
    const memo = validateMemo(input);
    const result = await this.database().query<MemoRow>(
      `UPDATE author_memos SET
         title=$3,body=$4,tags=$5::jsonb,revision=revision+1,updated_at=NOW()
       WHERE id=$1 AND revision=$2
       RETURNING id,title,body,tags,revision,created_at,updated_at`,
      [id,expectedRevision,memo.title,memo.body,JSON.stringify(memo.tags)],
    );
    if (result.rows[0]) return project(result.rows[0]);
    const existing = await this.database().query('SELECT 1 FROM author_memos WHERE id=$1',[id]);
    if (!existing.rowCount) throw new NotFoundException('メモが見つかりません。');
    throw new ConflictException('メモが他の編集により更新されました。');
  }
  async onModuleDestroy(): Promise<void> { await this.pool?.end(); }
}

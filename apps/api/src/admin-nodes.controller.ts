/**
 * Protected author CRUD over PostgreSQL transactions.
 * No browser-held key, mock login or trust in client-supplied user IDs.
 */
import {
  BadRequestException, Body, ConflictException, Controller, Get, HttpCode,
  NotFoundException, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  createNode, editNode, isKind, managedList, publishNode, setVisibility,
  type Content, type DomainError, type Kind,
} from '@eternalia/contracts';
import { AuthorGuard } from './author.guard';
import { LibraryStorageService } from './library-storage.service';

function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new BadRequestException('JSONオブジェクトが必要です。');
  }
  return input as Record<string,unknown>;
}
function translate(error: unknown): never {
  const value = error as Partial<DomainError> | null;
  if (value && typeof value.message === 'string') {
    if (value.code === 'bad-request') throw new BadRequestException(value.message);
    if (value.code === 'not-found') throw new NotFoundException(value.message);
    if (value.code === 'conflict') throw new ConflictException(value.message);
  }
  throw error;
}
async function withinDomain<T>(work: () => Promise<T>): Promise<T> {
  try { return await work(); } catch (error) { return translate(error); }
}

@Controller('admin')
@UseGuards(AuthorGuard)
export class AdminNodesController {
  constructor(private readonly storage: LibraryStorageService) {}

  @Get('nodes')
  async list() {
    return managedList(await this.storage.read());
  }

  @Post('nodes')
  async create(@Body() raw: unknown) {
    const input = record(raw);
    if (!isKind(input.kind) ||
      (input.parentId !== undefined && input.parentId !== null && typeof input.parentId !== 'string')) {
      throw new BadRequestException('種類または親IDが不正です。');
    }
    const id = randomUUID();
    const content = input.content as Content;
    return withinDomain(async () => {
      await this.storage.mutate(db => createNode(db, {
        id, kind: input.kind as Kind,
        parentId: input.parentId as string | null | undefined,
        content, now: Date.now(),
      }));
      return { id };
    });
  }

  @Patch('nodes/:id')
  async edit(@Param('id') id: string, @Body() raw: unknown) {
    const input = record(raw);
    return withinDomain(async () => {
      await this.storage.mutate(db => editNode(
        db, id, input.expectedRevision as number, input.content as Content, Date.now(),
      ));
      return { ok: true };
    });
  }

  @Post('nodes/:id/publish')
  @HttpCode(200)
  async publish(@Param('id') id: string, @Body() raw: unknown) {
    const input = record(raw);
    return withinDomain(async () => {
      await this.storage.mutate(db => publishNode(db,id,input.expectedRevision as number,Date.now()));
      return { ok: true };
    });
  }

  @Post('nodes/:id/visibility')
  @HttpCode(200)
  async visibility(@Param('id') id: string, @Body() raw: unknown) {
    const input = record(raw);
    return withinDomain(async () => {
      await this.storage.mutate(db => setVisibility(
        db,id,input.expectedRevision as number,input.isPublic as boolean,
        (input.publicSince ?? null) as number | null,Date.now(),
      ));
      return { ok: true };
    });
  }
}


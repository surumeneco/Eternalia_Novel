import {
  BadRequestException, Body, ConflictException, Controller,
  HttpCode, Post, UseGuards,
} from '@nestjs/common';
import { reorderSiblings, type DomainError, type Kind } from '@eternalia/contracts';
import { AuthorGuard } from './author.guard';
import { LibraryStorageService } from './library-storage.service';

@Controller('admin/order')
@UseGuards(AuthorGuard)
export class AuthorOrderController {
  constructor(private readonly storage: LibraryStorageService) {}

  @Post()
  @HttpCode(200)
  async reorder(@Body() raw: unknown) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new BadRequestException('並べ替え入力が不正です。');
    }
    const input = raw as Record<string, unknown>;
    if (!(input.parentId === null || typeof input.parentId === 'string') ||
      typeof input.kind !== 'string' || !Array.isArray(input.orderedIds) ||
      !input.orderedIds.every(id => typeof id === 'string') ||
      !input.expectedRevisions || typeof input.expectedRevisions !== 'object' ||
      Array.isArray(input.expectedRevisions)) {
      throw new BadRequestException('並べ替え対象と改訂番号が不正です。');
    }
    try {
      await this.storage.mutate(library => reorderSiblings(library, {
        parentId: input.parentId as string | null,
        kind: input.kind as Kind,
        orderedIds: input.orderedIds as string[],
        expectedRevisions: input.expectedRevisions as Record<string, number>,
      }, Date.now()));
      return { ok: true };
    } catch (error) {
      const value = error as Partial<DomainError> | null;
      if (value?.code === 'conflict') throw new ConflictException(value.message);
      if (value?.code === 'bad-request' || value?.code === 'not-found') throw new BadRequestException(value.message);
      throw error;
    }
  }
}

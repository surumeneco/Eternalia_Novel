import { BadRequestException, Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthorGuard } from './author.guard';
import { AuthorMemosService, validateMemo } from './author-memos.service';

@Controller('admin/memos')
@UseGuards(AuthorGuard)
export class AuthorMemosController {
  constructor(private readonly memos: AuthorMemosService) {}

  @Get()
  async list() { return this.memos.list(); }

  @Post()
  async create(@Body() raw: unknown) {
    return this.memos.create(validateMemo(raw));
  }

  @Patch(':id')
  async edit(@Param('id') id: string, @Body() raw: unknown) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new BadRequestException('更新データが不正です。');
    }
    const data = raw as Record<string, unknown>;
    return this.memos.edit(id,data.expectedRevision as number,validateMemo(data));
  }
}

import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { publicSeries, publicTree, toReader } from '@eternalia/contracts';
import { LocalAlphaLibraryService } from './local-alpha-library.service';

@Controller('public')
export class PublicSeriesController {
  constructor(private readonly library: LocalAlphaLibraryService) {}

  @Get('series')
  async list() {
    return publicSeries(await this.library.read(), Date.now());
  }

  @Get('series/:id/tree')
  async tree(@Param('id') id: string) {
    const nodes = publicTree(await this.library.read(), id, Date.now());
    if (!nodes.length) throw new NotFoundException('公開項目が見つかりません。');
    return nodes;
  }

  @Get('items/:id')
  async item(@Param('id') id: string) {
    const item = toReader(await this.library.read(), id, Date.now());
    if (!item) throw new NotFoundException('公開項目が見つかりません。');
    return item;
  }
}

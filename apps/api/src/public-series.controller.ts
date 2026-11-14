import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { publicRecent, publicSeries, publicTree, toReader } from '@eternalia/contracts';
import { LibraryStorageService } from './library-storage.service';
import { PublicClock } from './public-clock.service';

@Controller('public')
export class PublicSeriesController {
  constructor(
    private readonly library: LibraryStorageService,
    private readonly clock: PublicClock,
  ) {}

  @Get('recent')
  async recent() {
    return publicRecent(await this.library.read(), this.clock.now(), 12);
  }

  @Get('series')
  async list() {
    return publicSeries(await this.library.read(), this.clock.now());
  }

  @Get('series/:id/tree')
  async tree(@Param('id') id: string) {
    const nodes = publicTree(await this.library.read(), id, this.clock.now());
    if (!nodes.length) throw new NotFoundException('公開項目が見つかりません。');
    return nodes;
  }

  @Get('items/:id')
  async item(@Param('id') id: string) {
    const item = toReader(await this.library.read(), id, this.clock.now());
    if (!item) throw new NotFoundException('公開項目が見つかりません。');
    return item;
  }
}

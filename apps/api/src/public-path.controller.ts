import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { publicPath } from '@eternalia/contracts';
import { LibraryStorageService } from './library-storage.service';
import { PublicClock } from './public-clock.service';

@Controller('public/items')
export class PublicPathController {
  constructor(
    private readonly storage: LibraryStorageService,
    private readonly clock: PublicClock,
  ) {}

  @Get(':id/path')
  async read(@Param('id') id: string) {
    const path=publicPath(await this.storage.read(),id,this.clock.now());
    if (!path.length) throw new NotFoundException('公開項目が見つかりません。');
    return path;
  }
}

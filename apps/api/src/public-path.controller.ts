import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { publicPath } from '@eternalia/contracts';
import { LibraryStorageService } from './library-storage.service';

@Controller('public/items')
export class PublicPathController {
  constructor(private readonly storage: LibraryStorageService) {}

  @Get(':id/path')
  async read(@Param('id') id: string) {
    const path=publicPath(await this.storage.read(),id,Date.now());
    if (!path.length) throw new NotFoundException('公開項目が見つかりません。');
    return path;
  }
}

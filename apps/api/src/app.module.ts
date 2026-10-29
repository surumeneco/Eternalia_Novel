import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { AuthController } from './auth.controller';
import { AuthorGuard } from './author.guard';
import { DiscordAuthService } from './discord-auth.service';
import { LocalAlphaLibraryService } from './local-alpha-library.service';
import { LibraryStorageService } from './library-storage.service';
import { PostgresLibraryService } from './postgres-library.service';
import { PublicSeriesController } from './public-series.controller';

@Module({
  controllers: [HealthController, PublicSeriesController, AuthController],
  providers: [
    LocalAlphaLibraryService, PostgresLibraryService, LibraryStorageService,
    DiscordAuthService, AuthorGuard,
  ],
})
export class AppModule {}

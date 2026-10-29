import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { LocalAlphaLibraryService } from './local-alpha-library.service';
import { PublicSeriesController } from './public-series.controller';

@Module({
  controllers: [HealthController, PublicSeriesController],
  providers: [LocalAlphaLibraryService],
})
export class AppModule {}

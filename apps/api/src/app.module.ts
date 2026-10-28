import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PublicSeriesController } from './public-series.controller';
@Module({ controllers: [HealthController, PublicSeriesController] })
export class AppModule {}

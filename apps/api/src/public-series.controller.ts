import { Controller, Get } from '@nestjs/common';
/**
 * Safe placeholder. No DB read until the ancestor-visibility and snapshot
 * boundary have been wired into the server-side repository query.
 */
@Controller('public/series')
export class PublicSeriesController {
  @Get()
  list(): readonly [] {
    return [];
  }
}

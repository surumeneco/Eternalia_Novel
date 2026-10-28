import { Controller, Get } from '@nestjs/common';
@Controller('health')
export class HealthController {
  @Get()
  status(): { status: 'ok'; service: string } {
    return { status: 'ok', service: 'eternalia-api' };
  }
}

import { Injectable } from '@nestjs/common';

/** Request-time UTC milliseconds for anonymous publication projection.
 * The default always reads the real system clock; tests can replace this
 * dependency only inside an independently constructed Nest application.
 * There is deliberately no public API or environment-based clock override.
 */
@Injectable()
export class PublicClock {
  now(): number { return Date.now(); }
}

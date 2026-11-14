import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  // 100k Japanese characters may exceed Express' default JSON byte limit.
  app.useBodyParser('json', { limit: '512kb' });
  app.disable('x-powered-by');
  app.use((_request: unknown, response: { setHeader(name: string, value: string): void }, next: () => void) => {
    // Never trust/reflect client-provided correlation IDs. Each request gets
    // a fresh server-owned value, including denied and unknown API routes.
    response.setHeader('X-Request-Id', randomUUID());
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  await app.listen(Number(process.env.API_PORT ?? 3001), '127.0.0.1');
}
bootstrap().catch((error: unknown) => {
  console.error('API startup failed', error);
  process.exitCode = 1;
});

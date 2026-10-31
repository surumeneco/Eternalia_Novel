import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { type Library } from '@eternalia/contracts';
import { LocalAlphaLibraryService } from './local-alpha-library.service';
import { PostgresLibraryService } from './postgres-library.service';

/**
 * PostgreSQL is authoritative when DATABASE_URL is set.
 * Legacy preview JSON is read-only for migration compatibility and can NEVER
 * receive protected writes through Nest.
 */
@Injectable()
export class LibraryStorageService {
  constructor(
    private readonly postgres: PostgresLibraryService,
    private readonly legacy: LocalAlphaLibraryService,
  ) {}

  async read(): Promise<Library> {
    return this.postgres.enabled ? this.postgres.read() : this.legacy.read();
  }

  async mutate(transform: (library: Library) => Library): Promise<Library> {
    if (!this.postgres.enabled) {
      throw new ServiceUnavailableException('PostgreSQLを設定してください。');
    }
    return this.postgres.mutate(transform);
  }
}

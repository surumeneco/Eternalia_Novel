/**
 * Temporary α read-only adapter. NOT the approved PostgreSQL persistence layer.
 * It reads the existing loopback preview's atomically replaced JSON file.
 * A missing file is an empty library; a corrupt file is not silently reset.
 */
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { newLibrary, type Library } from '@eternalia/contracts';

@Injectable()
export class LocalAlphaLibraryService {
  private readonly filename = process.env.ALPHA_LIBRARY_FILE
    ? resolve(process.env.ALPHA_LIBRARY_FILE)
    : resolve(__dirname, '../../../.local/preview-data.json');

  async read(): Promise<Library> {
    let text: string;
    try {
      text = await readFile(this.filename, 'utf8');
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return newLibrary();
      throw new ServiceUnavailableException('公開データの読込に失敗しました。');
    }
    try {
      const value: unknown = JSON.parse(text);
      if (!value || typeof value !== 'object' || !Array.isArray((value as Library).nodes)) {
        throw new Error('Invalid local library');
      }
      return value as Library;
    } catch {
      throw new ServiceUnavailableException('公開データの形式を確認してください。');
    }
  }
}

import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

Object.assign(process.env, { NODE_ENV: 'test' });
process.env.DATABASE_NAME = process.env.DATABASE_NAME ?? 'stockly_test';
process.env.TYPEORM_CLI = 'true';

export default async function globalSetup(): Promise<void> {
  const { ensureTestDatabaseExists, runTestMigrations } = await import('../helpers/testDatabase');
  const { AppDataSource } = await import('../../../src/lib/database');

  await ensureTestDatabaseExists();

  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  await AppDataSource.initialize();
  await runTestMigrations(AppDataSource);
  await AppDataSource.destroy();
}

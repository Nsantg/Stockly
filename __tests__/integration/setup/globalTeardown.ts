export default async function globalTeardown(): Promise<void> {
  const { AppDataSource } = await import('../../../src/lib/database');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}

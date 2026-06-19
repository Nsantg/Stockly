/**
 * Tests para getDataSource (líneas 34-44 de src/lib/database.ts)
 *
 * Usa jest.isolateModules + require() por cada test para resetear el
 * singleton initPromise entre ejecuciones.
 */

describe('database.ts - getDataSource (líneas 34-44)', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('línea 35: retorna AppDataSource de inmediato si ya está inicializado', async () => {
    await jest.isolateModulesAsync(async () => {
      const { AppDataSource, getDataSource } = require('../../src/lib/database');
      const ds = AppDataSource as any;
      ds.isInitialized = true;
      const spy = jest.spyOn(AppDataSource, 'initialize');

      const result = await getDataSource();

      expect(result).toBe(AppDataSource);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  it('líneas 38-43: llama a initialize() cuando no está inicializado', async () => {
    await jest.isolateModulesAsync(async () => {
      const { AppDataSource, getDataSource } = require('../../src/lib/database');
      const ds = AppDataSource as any;
      ds.isInitialized = false;
      const spy = jest.spyOn(AppDataSource, 'initialize').mockResolvedValue(AppDataSource as any);

      const result = await getDataSource();

      expect(spy).toHaveBeenCalledTimes(1);
      expect(result).toBe(AppDataSource);
      spy.mockRestore();
    });
  });

  it('líneas 40-43: resetea initPromise si initialize() lanza error (permite reintento)', async () => {
    await jest.isolateModulesAsync(async () => {
      const { AppDataSource, getDataSource } = require('../../src/lib/database');
      const ds = AppDataSource as any;
      ds.isInitialized = false;

      const spy = jest
        .spyOn(AppDataSource, 'initialize')
        .mockRejectedValueOnce(new Error('Connection refused'))
        .mockResolvedValue(AppDataSource as any);

      // Primera llamada falla
      await expect(getDataSource()).rejects.toThrow('Connection refused');

      // Después del error initPromise debe quedar null → segunda llamada funciona
      const result = await getDataSource();
      expect(result).toBe(AppDataSource);
      expect(spy).toHaveBeenCalledTimes(2);
      spy.mockRestore();
    });
  });

  it('línea 36: reutiliza initPromise en llamadas concurrentes', async () => {
    await jest.isolateModulesAsync(async () => {
      const { AppDataSource, getDataSource } = require('../../src/lib/database');
      const ds = AppDataSource as any;
      ds.isInitialized = false;

      let resolve!: (ds: any) => void;
      const deferred = new Promise<any>((r) => { resolve = r; });
      const spy = jest.spyOn(AppDataSource, 'initialize').mockReturnValue(deferred);

      const p1 = getDataSource();
      const p2 = getDataSource(); // debe reutilizar la misma promesa

      resolve(AppDataSource);

      await Promise.all([p1, p2]);
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
    });
  });
});

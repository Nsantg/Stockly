import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import 'reflect-metadata';

describe('database helper getDataSource', () => {
  let AppDataSource: any;
  let getDataSource: any;
  let mockIsInitialized: boolean;
  let initializeSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    jest.resetModules();
    mockIsInitialized = false;

    const mod = await import('../../src/lib/database');
    AppDataSource = mod.AppDataSource;
    getDataSource = mod.getDataSource;

    Object.defineProperty(AppDataSource, 'isInitialized', {
      get: () => mockIsInitialized,
      configurable: true,
    });

    initializeSpy = jest.spyOn(AppDataSource, 'initialize');
  });

  afterEach(() => {
    initializeSpy.mockRestore();
  });

  it('debe retornar AppDataSource inmediatamente si ya está inicializado', async () => {
    mockIsInitialized = true;

    const ds = await getDataSource();

    expect(ds).toBe(AppDataSource);
    expect(initializeSpy).not.toHaveBeenCalled();
  });

  it('debe inicializar el datasource y retornar AppDataSource si no está inicializado', async () => {
    initializeSpy.mockResolvedValue(AppDataSource as never);

    const ds = await getDataSource();

    expect(ds).toBe(AppDataSource);
    expect(initializeSpy).toHaveBeenCalledTimes(1);
  });

  it('debe retornar la misma promesa si se llama concurrentemente mientras se inicializa', async () => {
    let resolveInit: (v: any) => void;
    const pendingInit = new Promise<any>((resolve) => {
      resolveInit = resolve;
    });
    initializeSpy.mockReturnValue(pendingInit as never);

    const promise1 = getDataSource();
    const promise2 = getDataSource();

    expect(promise1).toBe(promise2);

    resolveInit!(AppDataSource);
    await promise1;
    await promise2;

    expect(initializeSpy).toHaveBeenCalledTimes(1);
  });

  it('debe resetear initPromise si la inicialización falla', async () => {
    const error = new Error('Connection refused');
    initializeSpy.mockRejectedValue(error as never);

    await expect(getDataSource()).rejects.toThrow('Connection refused');

    initializeSpy.mockResolvedValue(AppDataSource as never);
    const ds = await getDataSource();
    expect(ds).toBe(AppDataSource);
    expect(initializeSpy).toHaveBeenCalledTimes(2);
  });

  it('debe reutilizar initPromise pendiente en llamadas concurrentes durante fallo', async () => {
    const error = new Error('Timeout');
    let rejectInit: (e: any) => void;
    const pendingInit = new Promise<any>((_, reject) => {
      rejectInit = reject;
    });
    initializeSpy.mockReturnValue(pendingInit as never);

    const promise1 = getDataSource();
    const promise2 = getDataSource();

    expect(promise1).toBe(promise2);

    rejectInit!(error);
    await expect(promise1).rejects.toThrow('Timeout');
    await expect(promise2).rejects.toThrow('Timeout');

    expect(initializeSpy).toHaveBeenCalledTimes(1);
  });

  it('debe reintentar la inicialización después de un fallo concurrente', async () => {
    const error = new Error('First failure');
    let rejectInit: (e: any) => void;
    const pendingInit = new Promise<any>((_, reject) => {
      rejectInit = reject;
    });
    initializeSpy.mockReturnValue(pendingInit as never);

    const p = getDataSource();
    rejectInit!(error);
    await expect(p).rejects.toThrow('First failure');

    initializeSpy.mockResolvedValue(AppDataSource as never);
    const ds = await getDataSource();
    expect(ds).toBe(AppDataSource);
    expect(initializeSpy).toHaveBeenCalledTimes(2);
  });
});

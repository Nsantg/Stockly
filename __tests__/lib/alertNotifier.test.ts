import { broadcastSummary, notifyStockChange, notifyEntryIssue, notifyExpirationIfNear } from '../../src/lib/realtime/alertNotifier';
import { getIO } from '../../src/lib/realtime/socketServer';
import { alertService } from '../../src/service/AlertService';
import { productRepository } from '../../src/repository/ProductRepository';
import { settingsService } from '../../src/service/SettingsService';
import type { EntryIssue } from '../../src/entity/EntryIssue';

jest.mock('../../src/lib/realtime/socketServer', () => ({
  getIO: jest.fn(),
}));

jest.mock('../../src/service/AlertService', () => ({
  alertService: { getAllAlerts: jest.fn() },
}));

jest.mock('../../src/repository/ProductRepository', () => ({
  productRepository: { findById: jest.fn() },
}));

jest.mock('../../src/service/SettingsService', () => ({
  settingsService: { getSettings: jest.fn() },
}));

const EMPTY_SUMMARY = {
  stockAlerts: [],
  expirationAlerts: [],
  totalCritical: 0,
  totalWarnings: 0,
};

function buildMockIO() {
  const emit = jest.fn();
  const to = jest.fn().mockReturnValue({ emit });
  return { io: { to, emit }, to, emit };
}

describe('alertNotifier — broadcastSummary', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna sin hacer nada si getIO() es null', async () => {
    (getIO as jest.Mock).mockReturnValue(null);
    await broadcastSummary();
    expect(alertService.getAllAlerts).not.toHaveBeenCalled();
  });

  it('emite alerts:summary a la room alerts cuando hay io', async () => {
    const { io, to, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    (alertService.getAllAlerts as jest.Mock).mockResolvedValue(EMPTY_SUMMARY);
    await broadcastSummary();
    expect(alertService.getAllAlerts).toHaveBeenCalledWith(30);
    expect(to).toHaveBeenCalledWith('alerts');
    expect(emit).toHaveBeenCalledWith('alerts:summary', EMPTY_SUMMARY);
  });

  it('no lanza si alertService.getAllAlerts rechaza', async () => {
    const { io } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    (alertService.getAllAlerts as jest.Mock).mockRejectedValue(new Error('db error'));
    await expect(broadcastSummary()).resolves.toBeUndefined();
  });
});

describe('alertNotifier — notifyStockChange', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna sin tocar el repositorio si getIO() es null', async () => {
    (getIO as jest.Mock).mockReturnValue(null);
    await notifyStockChange('product-uuid');
    expect(productRepository.findById).not.toHaveBeenCalled();
  });

  it('emite alerts:toast cuando stock <= minStock y luego broadcastSummary', async () => {
    const { io, to, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    (productRepository.findById as jest.Mock).mockResolvedValue({
      id: 'p1', name: 'Producto X', stock: 3, minStock: 5,
    });
    (alertService.getAllAlerts as jest.Mock).mockResolvedValue(EMPTY_SUMMARY);

    await notifyStockChange('p1');

    const toastCall = emit.mock.calls.find((c) => c[0] === 'alerts:toast');
    expect(toastCall).toBeDefined();
    expect(toastCall![1]).toMatchObject({
      level: 'critical',
      message: expect.stringContaining('Producto X'),
    });
    expect(emit).toHaveBeenCalledWith('alerts:summary', EMPTY_SUMMARY);
  });

  it('NO emite alerts:toast cuando stock > minStock pero sí broadcastSummary', async () => {
    const { io, to, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    (productRepository.findById as jest.Mock).mockResolvedValue({
      id: 'p2', name: 'Producto Y', stock: 10, minStock: 5,
    });
    (alertService.getAllAlerts as jest.Mock).mockResolvedValue(EMPTY_SUMMARY);

    await notifyStockChange('p2');

    const toastCall = emit.mock.calls.find((c) => c[0] === 'alerts:toast');
    expect(toastCall).toBeUndefined();
    expect(emit).toHaveBeenCalledWith('alerts:summary', EMPTY_SUMMARY);
  });

  it('no lanza si productRepository.findById rechaza', async () => {
    const { io } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    (productRepository.findById as jest.Mock).mockRejectedValue(new Error('db error'));
    await expect(notifyStockChange('p3')).resolves.toBeUndefined();
  });
});

describe('alertNotifier — notifyEntryIssue', () => {
  beforeEach(() => jest.clearAllMocks());

  const baseIssue: Partial<EntryIssue> = {
    id: 'i1',
    productId: 'p1',
    productName: 'Producto A',
    quantity: 5,
    issueType: 'DAMAGED',
    isResolved: false,
    resolvedByMovementId: null,
    resolvedAt: null,
  };

  it('retorna sin emitir si getIO() es null', async () => {
    (getIO as jest.Mock).mockReturnValue(null);
    await notifyEntryIssue(baseIssue as EntryIssue);
    // No io available; nothing to check on
    expect(getIO).toHaveBeenCalled();
  });

  it('emite alerts:entry_issue y alerts:toast con level warning para DAMAGED', async () => {
    const { io, to, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);

    await notifyEntryIssue(baseIssue as EntryIssue);

    expect(emit).toHaveBeenCalledWith('alerts:entry_issue', baseIssue);
    const toastCall = emit.mock.calls.find((c) => c[0] === 'alerts:toast');
    expect(toastCall![1]).toMatchObject({
      level: 'warning',
      message: expect.stringContaining('dañado'),
    });
  });

  it('emite mensaje "faltante" en alerts:toast para MISSING', async () => {
    const { io, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    const missingIssue = { ...baseIssue, id: 'i2', issueType: 'MISSING' as const };

    await notifyEntryIssue(missingIssue as EntryIssue);

    const toastCall = emit.mock.calls.find((c) => c[0] === 'alerts:toast');
    expect(toastCall![1]).toMatchObject({
      level: 'warning',
      message: expect.stringContaining('faltante'),
    });
  });

  it('no lanza si io.to().emit lanza internamente', async () => {
    const emit = jest.fn().mockImplementation(() => { throw new Error('socket error'); });
    const to = jest.fn().mockReturnValue({ emit });
    (getIO as jest.Mock).mockReturnValue({ to });

    await expect(notifyEntryIssue(baseIssue as EntryIssue)).resolves.toBeUndefined();
  });
});

describe('alertNotifier — notifyExpirationIfNear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (settingsService.getSettings as jest.Mock).mockResolvedValue({ expirationAlertDays: 7 });
  });

  function dateInDays(days: number): string {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString();
  }

  it('retorna sin emitir si getIO() es null', async () => {
    (getIO as jest.Mock).mockReturnValue(null);
    await notifyExpirationIfNear('Producto X', 'L-001', dateInDays(3));
    expect(getIO).toHaveBeenCalled();
  });

  it('retorna sin emitir si expirationDateStr es null', async () => {
    const { io, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    await notifyExpirationIfNear('Producto X', 'L-001', null);
    expect(emit).not.toHaveBeenCalled();
  });

  it('emite alerts:toast cuando faltan exactamente 7 días', async () => {
    const { io, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    await notifyExpirationIfNear('Producto Y', 'L-002', dateInDays(7));
    const toast = emit.mock.calls.find((c) => c[0] === 'alerts:toast');
    expect(toast).toBeDefined();
    expect(toast![1]).toMatchObject({ level: 'warning', message: expect.stringContaining('Producto Y') });
  });

  it('emite alerts:toast cuando faltan menos de 7 días (3 días)', async () => {
    const { io, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    await notifyExpirationIfNear('Producto Z', 'L-003', dateInDays(3));
    const toast = emit.mock.calls.find((c) => c[0] === 'alerts:toast');
    expect(toast).toBeDefined();
    expect(toast![1].message).toContain('3 días');
  });

  it('NO emite toast cuando faltan más de 7 días', async () => {
    const { io, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    await notifyExpirationIfNear('Producto W', 'L-004', dateInDays(8));
    expect(emit).not.toHaveBeenCalled();
  });

  it('respeta el intervalo configurado en settings (30 días)', async () => {
    const { io, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    (settingsService.getSettings as jest.Mock).mockResolvedValue({ expirationAlertDays: 30 });
    await notifyExpirationIfNear('Producto V', 'L-005', dateInDays(20));
    const toast = emit.mock.calls.find((c) => c[0] === 'alerts:toast');
    expect(toast).toBeDefined();
  });

  it('incluye número de lote en el mensaje cuando se provee', async () => {
    const { io, emit } = buildMockIO();
    (getIO as jest.Mock).mockReturnValue(io);
    await notifyExpirationIfNear('Producto A', 'LOTE-99', dateInDays(2));
    const toast = emit.mock.calls.find((c) => c[0] === 'alerts:toast');
    expect(toast![1].message).toContain('LOTE-99');
  });

  it('no lanza si emit lanza internamente', async () => {
    const emit = jest.fn().mockImplementation(() => { throw new Error('socket error'); });
    const to = jest.fn().mockReturnValue({ emit });
    (getIO as jest.Mock).mockReturnValue({ to });
    await expect(notifyExpirationIfNear('Producto A', 'L-001', dateInDays(1))).resolves.toBeUndefined();
  });
});

import { broadcastSummary, notifyStockChange, notifyEntryIssue } from '../../src/lib/realtime/alertNotifier';
import { getIO } from '../../src/lib/realtime/socketServer';
import { alertService } from '../../src/service/AlertService';
import { productRepository } from '../../src/repository/ProductRepository';
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

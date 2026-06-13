import { inventoryService } from '../../src/service/InventoryService';
import * as productSvc from '../../src/service/ProductService';
import { productRepository } from '../../src/repository/ProductRepository';
import { lotRepository } from '../../src/repository/LotRepository';

describe('InventoryService', () => {
  beforeAll(() => {
    (productSvc as any).productService = {
      createProduct: jest.fn(async (d: any) => ({ ...d, id: 'p-new' })),
      getAllProducts: jest.fn(async () => ({ data: [{ id: 'p1' }], total: 1 })),
    };

    jest.spyOn(productRepository, 'findBelowMinStock').mockImplementation(async () => [
      { id: 'p1', name: 'Prod 1', stock: 1, minStock: 5 },
    ] as any);

    jest.spyOn(lotRepository, 'findByProductId').mockImplementation(async (productId: string) => [
      { id: 'l1', productId, stock: 2, expirationDate: new Date(Date.now() + 1000 * 60 * 60) },
      { id: 'l2', productId, stock: 0, expirationDate: new Date(Date.now() + 2000 * 60 * 60) },
    ] as any);
  });

  afterAll(() => jest.restoreAllMocks());

  test('listInventory returns product list', async () => {
    const list = await inventoryService.listInventory();
    expect(Array.isArray(list)).toBe(true);
    expect(list[0].id).toBe('p1');
  });

  test('checkStockAlerts maps products to alerts', async () => {
    const alerts = await inventoryService.checkStockAlerts();
    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts[0].level).toBe('CRITICAL');
  });

  test('getNextLotForDispatch returns earliest available lot', async () => {
    const lot = await inventoryService.getNextLotForDispatch('p1');
    expect(lot).not.toBeNull();
    expect(lot?.id).toBe('l1');
  });
});

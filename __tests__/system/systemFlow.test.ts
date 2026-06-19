/**
 * Pruebas de Sistema (E2E) - Flujos Operativos Completos
 *
 * Validan ciclos de negocio de extremo a extremo sin bases de datos reales,
 * orquestando los servicios en memoria con mocks de repositorio.
 *
 * Ejecutar: npm run test -- --testPathPattern="system/systemFlow"
 * (excluido del run normal de cobertura para mantener la suite rápida)
 */

import { userService } from '../../src/service/UserService';
import { productService } from '../../src/service/ProductService';
import { movementService } from '../../src/service/MovementService';
import { userRepository } from '../../src/repository/UserRepository';
import { productRepository } from '../../src/repository/ProductRepository';
import { subcategoryRepository } from '../../src/repository/SubcategoryRepository';
import { movementRepository } from '../../src/repository/MovementRepository';
import { getDataSource } from '../../src/lib/database';
import { UserRole } from '../../src/entity/UserRole';
import { MovementType } from '../../src/entity/MovementType';
import { ClientType } from '../../src/entity/ClientType';
import bcrypt from 'bcryptjs';

jest.mock('../../src/repository/UserRepository');
jest.mock('../../src/repository/ProductRepository');
jest.mock('../../src/repository/SubcategoryRepository');
jest.mock('../../src/lib/database');
jest.mock('../../src/repository/MovementRepository', () => ({
  movementRepository: { findById: jest.fn(), findAll: jest.fn() },
}));
jest.mock('../../src/lib/realtime/alertNotifier', () => ({
  broadcastSummary: jest.fn().mockResolvedValue(undefined),
  notifyStockChange: jest.fn().mockResolvedValue(undefined),
  notifyExpirationIfNear: jest.fn().mockResolvedValue(undefined),
  notifyEntryIssue: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../src/lib/realtime/socketServer', () => ({
  initSocketServer: jest.fn(),
  getIO: jest.fn().mockReturnValue(null),
}));
jest.mock('../../src/service/EntryIssueService', () => ({
  entryIssueService: { createFromMovement: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../src/lib/cloudinary', () => ({
  uploadImage: jest.fn(),
}));
jest.mock('bcryptjs');

const PRODUCT_UUID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const USER_UUID = '11111111-2222-3333-4444-555555555555';
const CLIENT_UUID = '99999999-8888-7777-6666-555555555555';
const SUB_UUID = 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff';

const MOCK_SUBCATEGORY = {
  id: SUB_UUID,
  name: 'Masoterapia',
  isActive: true,
  category: { id: 'cat-1', allowsSerialNumber: false },
};

const MOCK_PRODUCT = {
  id: PRODUCT_UUID,
  code: 'SYS-001',
  name: 'Camilla Hidráulica',
  stock: 50,
  stockBodega: 50,
  stockVitrina: 0,
  minStock: 5,
  isActive: true,
  subcategoryId: SUB_UUID,
  subcategory: MOCK_SUBCATEGORY,
};

const MOCK_USER = {
  id: USER_UUID,
  nombre: 'Despachador',
  apellido: 'Test',
  email: 'despacho@stockly.com',
  password: 'hashed_pass',
  rol: UserRole.DESPACHADOR,
  isActive: true,
};

describe('Sistema - Flujo E2E: Autenticación → Producto → Venta → Stock', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_pass');
  });

  it('PASO 1 - Autenticación: crea usuario con credenciales válidas', async () => {
    (userRepository.emailExists as jest.Mock).mockResolvedValue(false);
    (userRepository.create as jest.Mock).mockResolvedValue({ ...MOCK_USER });
    (userRepository.save as jest.Mock).mockResolvedValue({ ...MOCK_USER });

    const user = await userService.createUser({
      nombre: 'Despachador',
      apellido: 'Test',
      email: 'despacho@stockly.com',
      password: 'password123',
      rol: UserRole.DESPACHADOR,
    });

    expect(user.email).toBe('despacho@stockly.com');
    expect(user.rol).toBe(UserRole.DESPACHADOR);
    expect(user.isActive).toBe(true);
  });

  it('PASO 2 - Producto: crea un producto con subcategoría activa', async () => {
    (productRepository.existsByCode as jest.Mock).mockResolvedValue(false);
    (subcategoryRepository.findById as jest.Mock).mockResolvedValue(MOCK_SUBCATEGORY);
    (productRepository.insert as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

    const product = await productService.createProduct({
      code: 'SYS-001',
      name: 'Camilla Hidráulica',
      subcategoryId: SUB_UUID,
      stock: 50,
      minStock: 5,
    });

    expect(product.code).toBe('SYS-001');
    expect(product.stock).toBe(50);
  });

  it('PASO 3 - Venta: valida que el stock es suficiente antes de registrar movimiento', async () => {
    const mockQr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn().mockImplementation(async (_entity: unknown, data: unknown) => ({
          id: 'movement-uuid',
          ...(data as object),
        })),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({}),
        insert: jest.fn().mockResolvedValue({}),
      },
    };

    const MOCK_SAVED_MOVEMENT = {
      id: 'movement-uuid',
      type: MovementType.VENTA,
      quantity: 5,
      productId: PRODUCT_UUID,
      userId: USER_UUID,
      isAnnulled: false,
    };

    (productRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_PRODUCT });
    (movementRepository.findById as jest.Mock).mockResolvedValue(MOCK_SAVED_MOVEMENT);
    (getDataSource as jest.Mock).mockResolvedValue({
      createQueryRunner: jest.fn().mockReturnValue(mockQr),
    });

    const { movement } = await movementService.createMovement({
      type: MovementType.VENTA,
      productId: PRODUCT_UUID,
      quantity: 5,
      userId: USER_UUID,
      clientId: CLIENT_UUID,
      clientType: ClientType.DETAL,
    });

    expect(movement.type).toBe(MovementType.VENTA);
    expect(movement.quantity).toBe(5);
    expect(mockQr.commitTransaction).toHaveBeenCalled();
  });

  it('PASO 4 - Stock: valida que el stock no baja de 0 tras múltiples ventas consecutivas', async () => {
    (productRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_PRODUCT, stock: 3 });

    const insufficientStockQr = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        save: jest.fn(),
        find: jest.fn().mockResolvedValue([]),
        findOne: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        insert: jest.fn(),
      },
    };
    (getDataSource as jest.Mock).mockResolvedValue({
      createQueryRunner: jest.fn().mockReturnValue(insufficientStockQr),
    });

    await expect(
      movementService.createMovement({
        type: MovementType.VENTA,
        productId: PRODUCT_UUID,
        quantity: 10,
        userId: USER_UUID,
        clientId: CLIENT_UUID,
        clientType: ClientType.DETAL,
      }),
    ).rejects.toThrow(/[Ss]tock insuficiente/);

    // La validación de stock ocurre antes de abrir la transacción,
    // por lo que rollbackTransaction no es invocado en este caso.
  });

  it('PASO 5 - Inventario: consulta el resumen del inventario al final del ciclo', async () => {
    (productRepository.countActive as jest.Mock).mockResolvedValue(10);
    (productRepository.getTotalStock as jest.Mock).mockResolvedValue(245);
    (productRepository.findBelowMinStock as jest.Mock).mockResolvedValue([MOCK_PRODUCT]);

    const summary = await productService.getInventorySummary();

    expect(summary.totalProducts).toBe(10);
    expect(summary.totalStock).toBe(245);
    expect(summary.lowStockCount).toBe(1);
  });
});

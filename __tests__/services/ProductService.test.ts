import { productService, createProductSchema } from '../../src/service/ProductService';
import * as productRepoModule from '../../src/repository/ProductRepository';
import * as subcategoryRepoModule from '../../src/repository/SubcategoryRepository';

jest.mock('../../src/repository/ProductRepository');
jest.mock('../../src/repository/SubcategoryRepository');

describe('ProductService', () => {
  let service: typeof productService;
  let mockProductRepo: jest.Mocked<typeof productRepoModule.productRepository>;
  let mockSubcategoryRepo: jest.Mocked<typeof subcategoryRepoModule.subcategoryRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockProductRepo = productRepoModule.productRepository as jest.Mocked<typeof productRepoModule.productRepository>;
    mockSubcategoryRepo = subcategoryRepoModule.subcategoryRepository as jest.Mocked<typeof subcategoryRepoModule.subcategoryRepository>;
    service = productService;
  });

  describe('createProduct', () => {
    it('debe crear un producto válido con todos los campos', async () => {
      const subcategoryId = '550e8400-e29b-41d4-a716-446655440000';
      const dto = {
        code: 'PROD-001',
        name: 'Producto Test',
        subcategoryId,
        barcode: '1234567890',
        serialNumber: 'SN-12345',
        weight: 2.5,
        requiresRefrigeration: true,
        stock: 100,
        minStock: 10,
      };

      mockProductRepo.existsByCode.mockResolvedValue(false);
      mockSubcategoryRepo.findById.mockResolvedValue({
        id: subcategoryId,
        name: 'Subcategoría Test',
        isActive: true,
        category: { id: '1', name: 'Electroterapia', allowsSerialNumber: true, requiresRefrigeration: false, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        categoryId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      mockProductRepo.insert.mockResolvedValue({
        id: '123',
        code: 'PROD-001',
        name: 'Producto Test',
        subcategoryId,
        barcode: '1234567890',
        serialNumber: 'SN-12345',
        weight: 2.5,
        requiresRefrigeration: true,
        stockBodega: 100,
        stockVitrina: 0,
      } as any);

      const result = await service.createProduct(dto);

      expect(result.code).toBe('PROD-001');
      expect(result.stockBodega).toBe(100);
      expect(result.stockVitrina).toBe(0);
      expect(mockProductRepo.existsByCode).toHaveBeenCalledWith('PROD-001');
      expect(mockProductRepo.insert).toHaveBeenCalled();
    });

    it('debe rechazar si el código ya existe', async () => {
      mockProductRepo.existsByCode.mockResolvedValue(true);

      await expect(
        service.createProduct({
          code: 'PROD-001',
          name: 'Producto Test',
          subcategoryId: '550e8400-e29b-41d4-a716-446655440000',
        })
      ).rejects.toThrow('Ya existe un producto con el código');
    });

    it('debe rechazar si la subcategoría no existe', async () => {
      mockProductRepo.existsByCode.mockResolvedValue(false);
      mockSubcategoryRepo.findById.mockResolvedValue(null);

      await expect(
        service.createProduct({
          code: 'PROD-001',
          name: 'Producto Test',
          subcategoryId: '550e8400-e29b-41d4-a716-446655440000',
        })
      ).rejects.toThrow('Subcategoría con id');
    });

    it('debe rechazar si la subcategoría no está activa', async () => {
      const subcategoryId = '550e8400-e29b-41d4-a716-446655440000';
      mockProductRepo.existsByCode.mockResolvedValue(false);
      mockSubcategoryRepo.findById.mockResolvedValue({
        id: subcategoryId,
        name: 'Subcategoría Inactiva',
        isActive: false,
        categoryId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      await expect(
        service.createProduct({
          code: 'PROD-001',
          name: 'Producto Test',
          subcategoryId,
        })
      ).rejects.toThrow('La subcategoría seleccionada no está activa');
    });

    it('debe permitir serialNumber cuando la categoría lo permite', async () => {
      const subcategoryId = '550e8400-e29b-41d4-a716-446655440000';
      mockProductRepo.existsByCode.mockResolvedValue(false);
      mockSubcategoryRepo.findById.mockResolvedValue({
        id: subcategoryId,
        name: 'Electro',
        isActive: true,
        category: { id: '1', name: 'Electroterapia', allowsSerialNumber: true, requiresRefrigeration: false, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        categoryId: '1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      mockProductRepo.insert.mockResolvedValue({
        id: '123',
        code: 'PROD-001',
        name: 'Equipo Eléctrico',
        subcategoryId,
        serialNumber: 'SN-12345',
        stockBodega: 50,
        stockVitrina: 0,
      } as any);

      await service.createProduct({
        code: 'PROD-001',
        name: 'Equipo Eléctrico',
        subcategoryId,
        serialNumber: 'SN-12345',
      });

      const insertCall = mockProductRepo.insert.mock.calls[0][0];
      expect(insertCall.serialNumber).toBe('SN-12345');
    });

    it('debe nulificar serialNumber cuando la categoría no lo permite', async () => {
      const subcategoryId = '550e8400-e29b-41d4-a716-446655440000';
      mockProductRepo.existsByCode.mockResolvedValue(false);
      mockSubcategoryRepo.findById.mockResolvedValue({
        id: subcategoryId,
        name: 'Masaje',
        isActive: true,
        category: { id: '2', name: 'Masoterapia', allowsSerialNumber: false, requiresRefrigeration: false, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null },
        categoryId: '2',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      mockProductRepo.insert.mockResolvedValue({
        id: '123',
        code: 'PROD-002',
        name: 'Equipo Masaje',
        subcategoryId,
        serialNumber: null,
        stockBodega: 30,
        stockVitrina: 0,
      } as any);

      await service.createProduct({
        code: 'PROD-002',
        name: 'Equipo Masaje',
        subcategoryId,
        serialNumber: 'SHOULD-BE-NULL',
      });

      const insertCall = mockProductRepo.insert.mock.calls[0][0];
      expect(insertCall.serialNumber).toBeNull();
    });

    it('debe validar que el código sea requerido', async () => {
      await expect(
        service.createProduct({
          code: '',
          name: 'Producto',
          subcategoryId: '550e8400-e29b-41d4-a716-446655440000',
        })
      ).rejects.toThrow();
    });

    it('debe validar que el nombre sea requerido', async () => {
      await expect(
        service.createProduct({
          code: 'PROD-001',
          name: '',
          subcategoryId: '550e8400-e29b-41d4-a716-446655440000',
        })
      ).rejects.toThrow();
    });

    it('debe rechazar peso negativo', async () => {
      await expect(
        service.createProduct({
          code: 'PROD-001',
          name: 'Producto',
          subcategoryId: '550e8400-e29b-41d4-a716-446655440000',
          weight: -5,
        })
      ).rejects.toThrow();
    });

    it('debe rechazar stock negativo', async () => {
      await expect(
        service.createProduct({
          code: 'PROD-001',
          name: 'Producto',
          subcategoryId: '550e8400-e29b-41d4-a716-446655440000',
          stock: -10,
        })
      ).rejects.toThrow();
    });
  });

  describe('getAllProducts', () => {
    it('debe retornar productos paginados', async () => {
      const mockResponse = {
        data: [
          { id: '1', code: 'P1', name: 'Producto 1' },
          { id: '2', code: 'P2', name: 'Producto 2' },
        ],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      mockProductRepo.findAllActive.mockResolvedValue(mockResponse as any);

      const result = service.getAllProducts({ page: 1, limit: 20 });

      expect(result).resolves.toEqual(mockResponse);
      expect(mockProductRepo.findAllActive).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });

    it('debe pasar filtros de búsqueda al repositorio', async () => {
      mockProductRepo.findAllActive.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      } as any);

      service.getAllProducts({ search: 'equipo', categoryId: 'cat-1' });

      expect(mockProductRepo.findAllActive).toHaveBeenCalledWith({
        search: 'equipo',
        categoryId: 'cat-1',
      });
    });
  });

  describe('getProductById', () => {
    it('debe retornar un producto por id', async () => {
      const productId = '123';
      const mockProduct = { id: productId, code: 'PROD-001', name: 'Producto' };

      mockProductRepo.findById.mockResolvedValue(mockProduct as any);

      const result = await service.getProductById(productId);

      expect(result).toEqual(mockProduct);
      expect(mockProductRepo.findById).toHaveBeenCalledWith(productId);
    });

    it('debe lanzar error si el producto no existe', async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(service.getProductById('invalid-id')).rejects.toThrow('Producto con id');
    });
  });

  describe('updateProduct', () => {
    it('debe actualizar un producto existente', async () => {
      const productId = '123';
      const existingProduct = {
        id: productId,
        code: 'PROD-001',
        name: 'Producto Original',
        subcategoryId: 'sub-1',
        serialNumber: null,
      };

      const subcategoryId = '550e8400-e29b-41d4-a716-446655440000';

      mockProductRepo.findById.mockResolvedValue(existingProduct as any);
      mockProductRepo.update.mockResolvedValue({
        ...existingProduct,
        name: 'Producto Actualizado',
      } as any);

      const result = await service.updateProduct(productId, { name: 'Producto Actualizado' });

      expect(result.name).toBe('Producto Actualizado');
      expect(mockProductRepo.update).toHaveBeenCalled();
    });

    it('debe validar que el nuevo código no sea duplicado', async () => {
      const productId = '123';
      const existingProduct = {
        id: productId,
        code: 'PROD-001',
        name: 'Producto Original',
        subcategoryId: 'sub-1',
      };

      mockProductRepo.findById.mockResolvedValue(existingProduct as any);
      mockProductRepo.existsByCode.mockResolvedValue(true);

      await expect(
        service.updateProduct(productId, { code: 'PROD-002' })
      ).rejects.toThrow('Ya existe un producto con el código');
    });

    it('debe lanzar error si intenta actualizar producto inexistente', async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      await expect(service.updateProduct('invalid-id', { name: 'Nuevo' })).rejects.toThrow(
        'Producto con id'
      );
    });

    it('debe manejar cambio de subcategoría', async () => {
      const productId = '123';
      const oldSubcategoryId = 'sub-1';
      const newSubcategoryId = '550e8400-e29b-41d4-a716-446655440001';

      const existingProduct = {
        id: productId,
        code: 'PROD-001',
        name: 'Producto',
        subcategoryId: oldSubcategoryId,
        subcategory: {
          id: oldSubcategoryId,
          name: 'Old Subcat',
          category: { allowsSerialNumber: false },
        },
      };

      const newSubcategory = {
        id: newSubcategoryId,
        name: 'New Subcat',
        category: { allowsSerialNumber: true },
      };

      mockProductRepo.findById.mockResolvedValue(existingProduct as any);
      mockSubcategoryRepo.findById.mockResolvedValue(newSubcategory as any);
      mockProductRepo.update.mockResolvedValue({
        ...existingProduct,
        subcategoryId: newSubcategoryId,
      } as any);

      await service.updateProduct(productId, {
        subcategoryId: newSubcategoryId,
        serialNumber: 'NEW-SN',
      });

      const updateCall = mockProductRepo.update.mock.calls[0];
      expect(updateCall[1].subcategoryId).toBe(newSubcategoryId);
    });
  });
});

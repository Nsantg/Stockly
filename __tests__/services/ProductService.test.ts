import { productService } from '../../src/service/ProductService';
import { productRepository } from '../../src/repository/ProductRepository';
import { subcategoryRepository } from '../../src/repository/SubcategoryRepository';
import { BusinessError } from '../../src/lib/errors';
import { ZodError } from 'zod';

jest.mock('../../src/repository/ProductRepository');
jest.mock('../../src/repository/SubcategoryRepository');

const VALID_DTO = {
  code: 'PRD-001',
  name: 'Electrodo TENS',
  subcategoryId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  stock: 10,
  minStock: 5,
};

const MOCK_SUBCATEGORY = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Electroterapia',
  isActive: true,
  category: { id: 'cat-1', allowsSerialNumber: true },
};

const MOCK_PRODUCT = {
  id: 'prod-uuid',
  ...VALID_DTO,
  isActive: true,
  subcategory: MOCK_SUBCATEGORY,
  subcategoryId: VALID_DTO.subcategoryId,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProductService - líneas 33-128', () => {

  // ─── createProduct (lines 33-58) ─────────────────────────────────────────

  describe('createProduct()', () => {
    it('líneas 33-58: crea un producto correctamente', async () => {
      (productRepository.existsByCode as jest.Mock).mockResolvedValue(false);
      (subcategoryRepository.findById as jest.Mock).mockResolvedValue(MOCK_SUBCATEGORY);
      (productRepository.insert as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

      const result = await productService.createProduct(VALID_DTO);

      expect(productRepository.existsByCode).toHaveBeenCalledWith('PRD-001');
      expect(subcategoryRepository.findById).toHaveBeenCalledWith(VALID_DTO.subcategoryId);
      expect(result.code).toBe('PRD-001');
    });

    it('lanza BusinessError si el código ya existe', async () => {
      (productRepository.existsByCode as jest.Mock).mockResolvedValue(true);

      await expect(productService.createProduct(VALID_DTO)).rejects.toThrow(BusinessError);
      expect(subcategoryRepository.findById).not.toHaveBeenCalled();
    });

    it('lanza BusinessError si la subcategoría no existe', async () => {
      (productRepository.existsByCode as jest.Mock).mockResolvedValue(false);
      (subcategoryRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(productService.createProduct(VALID_DTO)).rejects.toThrow(
        'Subcategoría con id',
      );
    });

    it('lanza BusinessError si la subcategoría no está activa', async () => {
      (productRepository.existsByCode as jest.Mock).mockResolvedValue(false);
      (subcategoryRepository.findById as jest.Mock).mockResolvedValue({
        ...MOCK_SUBCATEGORY,
        isActive: false,
      });

      await expect(productService.createProduct(VALID_DTO)).rejects.toThrow(
        'La subcategoría seleccionada no está activa',
      );
    });

    it('limpia serialNumber si la categoría no lo permite', async () => {
      (productRepository.existsByCode as jest.Mock).mockResolvedValue(false);
      (subcategoryRepository.findById as jest.Mock).mockResolvedValue({
        ...MOCK_SUBCATEGORY,
        category: { allowsSerialNumber: false },
      });
      (productRepository.insert as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

      await productService.createProduct({ ...VALID_DTO, serialNumber: 'SN-001' });

      expect(productRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ serialNumber: null }),
      );
    });

    it('lanza ZodError si datos inválidos', async () => {
      await expect(productService.createProduct({ code: '', name: '', subcategoryId: 'no-uuid' } as never)).rejects.toThrow(ZodError);
    });
  });

  // ─── getAllProducts (line 61) ────────────────────────────────────────────

  describe('getAllProducts()', () => {
    it('línea 61: delega a productRepository.findAllActive', async () => {
      (productRepository.findAllActive as jest.Mock).mockResolvedValue({ data: [MOCK_PRODUCT], total: 1, page: 1, limit: 20, totalPages: 1 });

      const result = await productService.getAllProducts({ search: 'elec' });

      expect(productRepository.findAllActive).toHaveBeenCalledWith({ search: 'elec' });
      expect(result.total).toBe(1);
    });
  });

  // ─── getProductById (lines 63-68) ────────────────────────────────────────

  describe('getProductById()', () => {
    it('retorna el producto si existe', async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

      const result = await productService.getProductById('prod-uuid');

      expect(result.id).toBe('prod-uuid');
    });

    it('lanza BusinessError si el producto no existe', async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(productService.getProductById('no-existe')).rejects.toThrow(
        'Producto con id "no-existe" no encontrado',
      );
    });
  });

  // ─── updateProduct (lines 70-100) ────────────────────────────────────────

  describe('updateProduct()', () => {
    it('actualiza campos permitidos del producto', async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
      (productRepository.existsByCode as jest.Mock).mockResolvedValue(false);
      (productRepository.update as jest.Mock).mockResolvedValue({ ...MOCK_PRODUCT, name: 'Actualizado' });

      const result = await productService.updateProduct('prod-uuid', { name: 'Actualizado' });

      expect(productRepository.update).toHaveBeenCalled();
      expect(result.name).toBe('Actualizado');
    });

    it('lanza BusinessError si el nuevo código ya existe en otro producto', async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
      (productRepository.existsByCode as jest.Mock).mockResolvedValue(true);

      await expect(
        productService.updateProduct('prod-uuid', { code: 'OTRO-001' }),
      ).rejects.toThrow(BusinessError);
    });

    it('lanza BusinessError si la nueva subcategoría no existe', async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
      (subcategoryRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        productService.updateProduct('prod-uuid', { subcategoryId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff' }),
      ).rejects.toThrow('Subcategoría con id');
    });

    it('lanza BusinessError si la nueva subcategoría está inactiva', async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
      (subcategoryRepository.findById as jest.Mock).mockResolvedValue({ ...MOCK_SUBCATEGORY, isActive: false });

      await expect(
        productService.updateProduct('prod-uuid', { subcategoryId: 'bbbbbbbb-cccc-dddd-eeee-ffffffffffff' }),
      ).rejects.toThrow('La subcategoría seleccionada no está activa');
    });
  });

  // ─── deleteProduct (lines 102-105) ───────────────────────────────────────

  describe('deleteProduct()', () => {
    it('soft-elimina el producto si existe', async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
      (productRepository.softDelete as jest.Mock).mockResolvedValue(undefined);

      await productService.deleteProduct('prod-uuid');

      expect(productRepository.softDelete).toHaveBeenCalledWith('prod-uuid');
    });

    it('lanza BusinessError si el producto no existe al eliminar', async () => {
      (productRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(productService.deleteProduct('no-existe')).rejects.toThrow(BusinessError);
    });
  });

  // ─── searchForAutocomplete (lines 107-112) ───────────────────────────────

  describe('searchForAutocomplete()', () => {
    it('línea 107: delega con query trimmed', async () => {
      (productRepository.findForAutocomplete as jest.Mock).mockResolvedValue([{ id: 'prod-uuid', code: 'PRD-001', name: 'Electrodo' }]);

      const result = await productService.searchForAutocomplete('  elec  ');

      expect(productRepository.findForAutocomplete).toHaveBeenCalledWith('elec', undefined, undefined);
      expect(result).toHaveLength(1);
    });
  });

  // ─── getInventorySummary (lines 114-128) ─────────────────────────────────

  describe('getInventorySummary()', () => {
    it('líneas 114-128: retorna resumen de inventario', async () => {
      (productRepository.countActive as jest.Mock).mockResolvedValue(10);
      (productRepository.getTotalStock as jest.Mock).mockResolvedValue(250);
      (productRepository.findBelowMinStock as jest.Mock).mockResolvedValue([MOCK_PRODUCT, MOCK_PRODUCT]);

      const result = await productService.getInventorySummary();

      expect(result.totalProducts).toBe(10);
      expect(result.totalStock).toBe(250);
      expect(result.lowStockCount).toBe(2);
    });
  });
});

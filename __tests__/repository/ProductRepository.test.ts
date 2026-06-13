import { productRepository } from '../../src/repository/ProductRepository';
import * as db from '../../src/lib/database';

class QueryBuilderMock {
  private result: any;
  constructor(result: any) {
    this.result = result;
  }
  leftJoinAndSelect() { return this; }
  where() { return this; }
  andWhere() { return this; }
  orderBy() { return this; }
  skip() { return this; }
  take() { return this; }
  limit() { return this; }
  select() { return this; }
  getCount() { return Promise.resolve(this.result.count ?? 0); }
  getMany() { return Promise.resolve(this.result.many ?? []); }
  getOne() { return Promise.resolve(this.result.one ?? null); }
  getRawOne() { return Promise.resolve(this.result.raw ?? { total: '0' }); }
}

describe('ProductRepository', () => {
  const repoMock: any = {
    createQueryBuilder: () => new QueryBuilderMock({ count: 2, many: [{ id: 'p1' }, { id: 'p2' }], one: { id: 'p1' }, raw: { total: '42' } }),
    findOne: jest.fn(async (opts) => ({ id: 'code-1', code: opts.where.code })),
    find: jest.fn(async () => [{ id: 'p1' }]),
    count: jest.fn(async () => 5),
    insert: jest.fn(async () => ({ identifiers: [{ id: 'new-id' }] })),
    update: jest.fn(async () => ({})),
    softDelete: jest.fn(async () => ({})),
  };

  beforeAll(() => {
    jest.spyOn(db, 'getDataSource').mockImplementation(async () => ({ getRepository: () => repoMock } as any));
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('findAllActive returns paginated result with search and counts', async () => {
    const res = await productRepository.findAllActive({ search: 'abc', page: 1, limit: 10 });
    expect(res.total).toBe(2);
    expect(res.data).toHaveLength(2);
    expect(res.totalPages).toBe(Math.ceil(2 / 10));
  });

  test('findById returns single product', async () => {
    const p = await productRepository.findById('p1');
    expect(p).toEqual({ id: 'p1' });
  });

  test('findByCode returns matching product', async () => {
    const p = await productRepository.findByCode('X');
    expect(p?.code).toBe('X');
  });

  test('existsByCode returns true/false based on count', async () => {
    const exists = await productRepository.existsByCode('X');
    expect(exists).toBe(true);
    const existsExcluded = await productRepository.existsByCode('X', 'exclude');
    expect(existsExcluded).toBe(true);
  });

  test('findForAutocomplete with query and empty query', async () => {
    const withQuery = await productRepository.findForAutocomplete('abc');
    expect(Array.isArray(withQuery)).toBe(true);
    const empty = await productRepository.findForAutocomplete('');
    expect(Array.isArray(empty)).toBe(true);
  });

  test('getTotalStock returns parsed integer', async () => {
    const total = await productRepository.getTotalStock();
    expect(total).toBe(42);
  });

  test('countActive delegates to repository.count', async () => {
    const c = await productRepository.countActive();
    expect(c).toBe(5);
  });

  test('findBelowMinStock and findBySubcategoryId return arrays', async () => {
    const below = await productRepository.findBelowMinStock();
    expect(Array.isArray(below)).toBe(true);
    const bySub = await productRepository.findBySubcategoryId('s1');
    expect(Array.isArray(bySub)).toBe(true);
  });

  test('insert/update/softDelete flows', async () => {
    const inserted = await productRepository.insert({ name: 'x' } as any);
    expect(inserted).toEqual({ id: 'p1' });
    const updated = await productRepository.update('p1', { name: 'y' } as any);
    expect(updated).toEqual({ id: 'p1' });
    await expect(productRepository.softDelete('p1')).resolves.toBeUndefined();
  });
});
import { productRepository, PaginatedProducts } from '../../src/repository/ProductRepository';
import { Product } from '../../src/entity/Product';
import * as databaseModule from '../../src/lib/database';

jest.mock('../../src/lib/database');

describe('ProductRepository', () => {
  let repository: typeof productRepository;
  let mockQueryBuilder: any;
  let mockRepo: any;
  let mockDataSource: any;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = productRepository;

    mockQueryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(0),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn().mockResolvedValue(null),
    };

    mockRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
      remove: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
    };

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockRepo),
    };

    (databaseModule.getDataSource as jest.Mock).mockResolvedValue(mockDataSource);
  });

  describe('findAllActive', () => {
    it('debe retornar productos paginados sin filtros', async () => {
      const mockProducts: Product[] = [
        { id: '1', code: 'PROD-001', name: 'Producto 1', isActive: true } as Product,
      ];
      mockQueryBuilder.getCount.mockResolvedValue(1);
      mockQueryBuilder.getMany.mockResolvedValue(mockProducts);

      const result = await repository.findAllActive({ page: 1, limit: 20 });

      expect(result.data).toEqual(mockProducts);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.totalPages).toBe(1);
    });

    it('debe filtrar por categoryId', async () => {
      const mockProducts: Product[] = [];
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue(mockProducts);

      await repository.findAllActive({ categoryId: 'cat-1', page: 1, limit: 20 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'category.id = :categoryId',
        { categoryId: 'cat-1' }
      );
    });

    it('debe filtrar por subcategoryId', async () => {
      const mockProducts: Product[] = [];
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue(mockProducts);

      await repository.findAllActive({ subcategoryId: 'sub-1', page: 1, limit: 20 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.subcategoryId = :subcategoryId',
        { subcategoryId: 'sub-1' }
      );
    });

    it('debe filtrar por búsqueda de texto', async () => {
      const mockProducts: Product[] = [];
      mockQueryBuilder.getCount.mockResolvedValue(0);
      mockQueryBuilder.getMany.mockResolvedValue(mockProducts);

      await repository.findAllActive({ search: 'electro', page: 1, limit: 20 });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(product.code) LIKE LOWER(:search) OR LOWER(product.name) LIKE LOWER(:search))',
        { search: '%electro%' }
      );
    });

    it('debe paginar correctamente', async () => {
      const mockProducts: Product[] = [];
      mockQueryBuilder.getCount.mockResolvedValue(100);
      mockQueryBuilder.getMany.mockResolvedValue(mockProducts);

      const result = await repository.findAllActive({ page: 2, limit: 20 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(result.totalPages).toBe(5);
    });

    it('debe retornar página 1 por defecto', async () => {
      const mockProducts: Product[] = [];
      mockQueryBuilder.getCount.mockResolvedValue(50);
      mockQueryBuilder.getMany.mockResolvedValue(mockProducts);

      const result = await repository.findAllActive({ limit: 20 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
      expect(result.page).toBe(1);
    });
  });

  describe('findById', () => {
    it('debe retornar un producto por id si existe', async () => {
      const mockProduct: Product = {
        id: '1',
        code: 'PROD-001',
        name: 'Producto 1',
        isActive: true,
      } as Product;
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);

      const result = await repository.findById('1');

      expect(result).toEqual(mockProduct);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('product.id = :id', { id: '1' });
    });

    it('debe retornar null si no existe', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      const result = await repository.findById('invalid-id');

      expect(result).toBeNull();
    });

    it('debe validar que el producto esté activo', async () => {
      mockQueryBuilder.getOne.mockResolvedValue(null);

      await repository.findById('1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.isActive = :isActive',
        { isActive: true }
      );
    });
  });

  describe('findByCode', () => {
    it('debe retornar producto por código', async () => {
      const mockProduct: Product = {
        id: '1',
        code: 'PROD-001',
        name: 'Producto 1',
      } as Product;
      mockRepo.findOne.mockResolvedValue(mockProduct);

      const result = await repository.findByCode('PROD-001');

      expect(result).toEqual(mockProduct);
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { code: 'PROD-001' } });
    });

    it('debe retornar null si el código no existe', async () => {
      mockRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByCode('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('existsByCode', () => {
    it('debe retornar true si el código existe', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(1);

      const result = await repository.existsByCode('PROD-001');

      expect(result).toBe(true);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith('product.code = :code', { code: 'PROD-001' });
    });

    it('debe retornar false si el código no existe', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);

      const result = await repository.existsByCode('INVALID');

      expect(result).toBe(false);
    });

    it('debe excluir un id específico de la búsqueda', async () => {
      mockQueryBuilder.getCount.mockResolvedValue(0);

      await repository.existsByCode('PROD-001', 'exclude-id');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'product.id != :excludeId',
        { excludeId: 'exclude-id' }
      );
    });
  });

  describe('update', () => {
    it('debe actualizar un producto', async () => {
      const mockProduct: Product = {
        id: '1',
        code: 'PROD-001',
        name: 'Producto 1',
        isActive: true,
      } as Product;
      mockRepo.update.mockResolvedValue(undefined);
      mockQueryBuilder.getOne.mockResolvedValue(mockProduct);

      const result = await repository.update('1', { name: 'Producto Actualizado' });

      expect(mockRepo.update).toHaveBeenCalledWith('1', { name: 'Producto Actualizado' });
      expect(result).toEqual(mockProduct);
    });
  });

  describe('softDelete', () => {
    it('debe marcar un producto como eliminado', async () => {
      mockRepo.softDelete.mockResolvedValue(undefined);

      await repository.softDelete('1');

      expect(mockRepo.softDelete).toHaveBeenCalledWith('1');
    });
  });
});

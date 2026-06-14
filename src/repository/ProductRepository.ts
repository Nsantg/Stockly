import { getDataSource } from '../lib/database';
import { Product } from '../entity/Product';

export interface ProductFilters {
  categoryId?: string;
  subcategoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class ProductRepository {
  private async getRepo() {
    return (await getDataSource()).getRepository(Product);
  }

  async findAllActive(filters: ProductFilters = {}): Promise<PaginatedProducts> {
    const { categoryId, subcategoryId, search, page = 1, limit = 20 } = filters;
    const repo = await this.getRepo();

    const qb = repo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.subcategory', 'subcategory')
      .leftJoinAndSelect('subcategory.category', 'category')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.deletedAt IS NULL');

    if (subcategoryId) {
      qb.andWhere('product.subcategoryId = :subcategoryId', { subcategoryId });
    } else if (categoryId) {
      qb.andWhere('category.id = :categoryId', { categoryId });
    }

    if (search) {
      qb.andWhere(
        '(LOWER(product.code) LIKE LOWER(:search) OR LOWER(product.name) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    const total = await qb.getCount();
    const data = await qb
      .orderBy('product.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  findById(id: string): Promise<Product | null> {
    return this.getRepo().then((repo) =>
      repo
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.subcategory', 'subcategory')
        .leftJoinAndSelect('subcategory.category', 'category')
        .where('product.id = :id', { id })
        .andWhere('product.isActive = :isActive', { isActive: true })
        .andWhere('product.deletedAt IS NULL')
        .getOne(),
    );
  }

  findByCode(code: string): Promise<Product | null> {
    return this.getRepo().then((repo) => repo.findOne({ where: { code } }));
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const repo = await this.getRepo();
    const qb = repo
      .createQueryBuilder('product')
      .where('product.code = :code', { code });

    if (excludeId) {
      qb.andWhere('product.id != :excludeId', { excludeId });
    }

    return (await qb.getCount()) > 0;
  }

  findForAutocomplete(query: string, allowsSerialNumber?: boolean): Promise<Pick<Product, 'id' | 'code' | 'name'>[]> {
    return this.getRepo().then((repo) => {
      const qb = repo
        .createQueryBuilder('product')
        .select(['product.id', 'product.code', 'product.name'])
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.deletedAt IS NULL')
        .orderBy('product.name', 'ASC');

      if (allowsSerialNumber !== undefined) {
        qb.leftJoin('product.subcategory', 'subcategory')
          .leftJoin('subcategory.category', 'category')
          .andWhere('category.allowsSerialNumber = :allowsSerialNumber', { allowsSerialNumber });
      }

      if (query.trim()) {
        qb.andWhere(
          '(LOWER(product.code) LIKE LOWER(:q) OR LOWER(product.name) LIKE LOWER(:q))',
          { q: `%${query}%` },
        ).limit(20);
      } else {
        qb.limit(200);
      }

      return qb.getMany();
    });
  }

  async getTotalStock(): Promise<number> {
    const repo = await this.getRepo();
    const result = await repo
      .createQueryBuilder('product')
      .select('SUM(product.stock)', 'total')
      .where('product.isActive = true')
      .andWhere('product.deletedAt IS NULL')
      .getRawOne<{ total: string }>();
    return parseInt(result?.total ?? '0', 10);
  }

  async countActive(): Promise<number> {
    const repo = await this.getRepo();
    return repo.count({ where: { isActive: true } });
  }

  findBelowMinStock(): Promise<Product[]> {
    return this.getRepo().then((repo) =>
      repo
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.subcategory', 'subcategory')
        .where('product.isActive = true')
        .andWhere('product.deletedAt IS NULL')
        .andWhere('product.stock <= product.minStock')
        .orderBy('product.stock', 'ASC')
        .getMany(),
    );
  }

  findBySubcategoryId(subcategoryId: string): Promise<Product[]> {
    return this.getRepo().then((repo) =>
      repo.find({ where: { subcategoryId, isActive: true } }),
    );
  }

  async insert(data: Partial<Product>): Promise<Product> {
    const repo = await this.getRepo();
    const result = await repo.insert(data);
    return this.findById(result.identifiers[0].id) as Promise<Product>;
  }

  async update(id: string, data: Partial<Product>): Promise<Product> {
    const repo = await this.getRepo();
    await repo.update(id, data);
    return this.findById(id) as Promise<Product>;
  }

  async softDelete(id: string): Promise<void> {
    const repo = await this.getRepo();
    await repo.softDelete(id);
  }
}

export const productRepository = new ProductRepository();

import { getDataSource } from '../lib/database';
import { Category } from '../entity/Category';

class CategoryRepository {
  private async getRepo() {
    return (await getDataSource()).getRepository(Category);
  }

  findAllActive(): Promise<Category[]> {
    return this.getRepo().then((repo) =>
      repo.find({ where: { isActive: true }, order: { name: 'ASC' } }),
    );
  }

  findById(id: string): Promise<Category | null> {
    return this.getRepo().then((repo) =>
      repo.findOne({ where: { id, isActive: true } }),
    );
  }

  findByName(name: string): Promise<Category | null> {
    return this.getRepo().then((repo) =>
      repo.findOne({ where: { name } }),
    );
  }

  async existsByName(name: string, excludeId?: string): Promise<boolean> {
    const repo = await this.getRepo();
    const qb = repo
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name });

    if (excludeId) {
      qb.andWhere('category.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  create(data: Partial<Category>): Promise<Category> {
    return this.getRepo().then((repo) => repo.create(data) as Category);
  }

  save(category: Category): Promise<Category> {
    return this.getRepo().then((repo) => repo.save(category));
  }

  async softDelete(id: string): Promise<void> {
    const repo = await this.getRepo();
    await repo.softDelete(id);
  }
}

export const categoryRepository = new CategoryRepository();

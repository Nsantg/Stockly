import { getDataSource } from '../lib/database';
import { Subcategory } from '../entity/Subcategory';

class SubcategoryRepository {
  private async getRepo() {
    return (await getDataSource()).getRepository(Subcategory);
  }

  findByCategoryId(categoryId: string): Promise<Subcategory[]> {
    return this.getRepo().then((repo) =>
      repo.find({
        where: { categoryId, isActive: true },
        relations: { category: true },
        order: { name: 'ASC' },
      }),
    );
  }

  findAllActive(): Promise<Subcategory[]> {
    return this.getRepo().then((repo) =>
      repo.find({
        where: { isActive: true },
        relations: { category: true },
        order: { name: 'ASC' },
      }),
    );
  }

  findById(id: string): Promise<Subcategory | null> {
    return this.getRepo().then((repo) =>
      repo.findOne({
        where: { id, isActive: true },
        relations: { category: true },
      }),
    );
  }

  async existsByNameInCategory(
    name: string,
    categoryId: string,
    excludeId?: string,
  ): Promise<boolean> {
    const repo = await this.getRepo();
    const qb = repo
      .createQueryBuilder('sub')
      .where('LOWER(sub.name) = LOWER(:name)', { name })
      .andWhere('sub.categoryId = :categoryId', { categoryId });

    if (excludeId) {
      qb.andWhere('sub.id != :excludeId', { excludeId });
    }

    const count = await qb.getCount();
    return count > 0;
  }

  create(data: Partial<Subcategory>): Promise<Subcategory> {
    return this.getRepo().then((repo) => repo.create(data) as Subcategory);
  }

  save(subcategory: Subcategory): Promise<Subcategory> {
    return this.getRepo().then((repo) => repo.save(subcategory));
  }

  async softDelete(id: string): Promise<void> {
    const repo = await this.getRepo();
    await repo.softDelete(id);
  }
}

export const subcategoryRepository = new SubcategoryRepository();

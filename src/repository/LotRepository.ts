import { getDataSource } from '../lib/database';
import { Lot } from '../entity/Lot';

class LotRepository {
  private async getRepo() {
    return (await getDataSource()).getRepository(Lot);
  }

  findByProductId(productId: string): Promise<Lot[]> {
    return this.getRepo().then((repo) =>
      repo.find({
        where: { productId },
        order: { expirationDate: 'ASC' },
      }),
    );
  }

  findExpiringBefore(date: Date): Promise<Lot[]> {
    return this.getRepo().then((repo) =>
      repo
        .createQueryBuilder('lot')
        .leftJoinAndSelect('lot.product', 'product')
        .where('lot.expirationDate IS NOT NULL')
        .andWhere('lot.expirationDate < :date', { date })
        .andWhere('lot.stock > 0')
        .orderBy('lot.expirationDate', 'ASC')
        .getMany(),
    );
  }

  create(data: Partial<Lot>): Promise<Lot> {
    return this.getRepo().then((repo) => repo.create(data) as Lot);
  }

  save(lot: Lot): Promise<Lot> {
    return this.getRepo().then((repo) => repo.save(lot));
  }

  async softDelete(id: string): Promise<void> {
    const repo = await this.getRepo();
    await repo.softDelete(id);
  }
}

export const lotRepository = new LotRepository();

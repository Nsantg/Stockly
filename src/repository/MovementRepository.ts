import { getDataSource } from '../lib/database';
import { Movement } from '../entity/Movement';
import { MovementType } from '../entity/MovementType';

export interface MovementFilters {
  productId?: string;
  userId?: string;
  type?: MovementType;
  startDate?: Date;
  endDate?: Date;
  isAnnulled?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedMovements {
  data: Movement[];
  total: number;
  page: number;
  limit: number;
}

class MovementRepository {
  private async getRepo() {
    return (await getDataSource()).getRepository(Movement);
  }

  async findAll(filters: MovementFilters = {}): Promise<PaginatedMovements> {
    const { productId, userId, type, startDate, endDate, isAnnulled, page = 1, limit = 20 } = filters;
    const repo = await this.getRepo();

    const qb = repo
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.user', 'user')
      .leftJoinAndSelect('movement.client', 'client')
      .leftJoinAndSelect('movement.annulledBy', 'annulledBy');

    if (productId) {
      qb.andWhere('movement.productId = :productId', { productId });
    }
    if (userId) {
      qb.andWhere('movement.userId = :userId', { userId });
    }
    if (type) {
      qb.andWhere('movement.type = :type', { type });
    }
    if (startDate) {
      qb.andWhere('movement.date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('movement.date <= :endDate', { endDate });
    }
    if (isAnnulled !== undefined) {
      qb.andWhere('movement.isAnnulled = :isAnnulled', { isAnnulled });
    }

    const total = await (
      isAnnulled !== undefined
        ? qb.clone()
        : qb.clone().andWhere('movement.isAnnulled = false')
    ).getCount();

    const data = await qb
      .orderBy('movement.date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, limit };
  }

  findById(id: string): Promise<Movement | null> {
    return this.getRepo().then((repo) =>
      repo
        .createQueryBuilder('movement')
        .leftJoinAndSelect('movement.product', 'product')
        .leftJoinAndSelect('movement.user', 'user')
        .leftJoinAndSelect('movement.client', 'client')
        .leftJoinAndSelect('movement.annulledBy', 'annulledBy')
        .where('movement.id = :id', { id })
        .getOne(),
    );
  }

  findByProductId(productId: string): Promise<Movement[]> {
    return this.getRepo().then((repo) =>
      repo
        .createQueryBuilder('movement')
        .leftJoinAndSelect('movement.product', 'product')
        .leftJoinAndSelect('movement.user', 'user')
        .leftJoinAndSelect('movement.client', 'client')
        .where('movement.productId = :productId', { productId })
        .orderBy('movement.date', 'DESC')
        .getMany(),
    );
  }

  findByUserId(userId: string): Promise<Movement[]> {
    return this.getRepo().then((repo) =>
      repo
        .createQueryBuilder('movement')
        .leftJoinAndSelect('movement.product', 'product')
        .leftJoinAndSelect('movement.user', 'user')
        .leftJoinAndSelect('movement.client', 'client')
        .where('movement.userId = :userId', { userId })
        .orderBy('movement.date', 'DESC')
        .getMany(),
    );
  }

  async countByType(type: MovementType, startDate?: Date, endDate?: Date): Promise<number> {
    const repo = await this.getRepo();
    const qb = repo
      .createQueryBuilder('movement')
      .where('movement.type = :type', { type })
      .andWhere('movement.isAnnulled = false');

    if (startDate) {
      qb.andWhere('movement.date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('movement.date <= :endDate', { endDate });
    }

    return qb.getCount();
  }

  async sumQuantityByProductAndType(productId: string, type: MovementType): Promise<number> {
    const repo = await this.getRepo();
    const result = await repo
      .createQueryBuilder('movement')
      .select('SUM(movement.quantity)', 'total')
      .where('movement.productId = :productId', { productId })
      .andWhere('movement.type = :type', { type })
      .andWhere('movement.isAnnulled = false')
      .getRawOne<{ total: string }>();
    return parseInt(result?.total ?? '0', 10);
  }

  async findAllForExport(filters: Omit<MovementFilters, 'page' | 'limit'> = {}): Promise<Movement[]> {
    const { productId, userId, type, startDate, endDate, isAnnulled } = filters;
    const repo = await this.getRepo();

    const qb = repo
      .createQueryBuilder('movement')
      .leftJoinAndSelect('movement.product', 'product')
      .leftJoinAndSelect('movement.user', 'user')
      .leftJoinAndSelect('movement.client', 'client')
      .leftJoinAndSelect('movement.annulledBy', 'annulledBy');

    if (productId) {
      qb.andWhere('movement.productId = :productId', { productId });
    }
    if (userId) {
      qb.andWhere('movement.userId = :userId', { userId });
    }
    if (type) {
      qb.andWhere('movement.type = :type', { type });
    }
    if (startDate) {
      qb.andWhere('movement.date >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('movement.date <= :endDate', { endDate });
    }
    if (isAnnulled !== undefined) {
      qb.andWhere('movement.isAnnulled = :isAnnulled', { isAnnulled });
    }

    return qb.orderBy('movement.date', 'DESC').getMany();
  }

  async save(movement: Movement): Promise<Movement> {
    const repo = await this.getRepo();
    return repo.save(movement);
  }
}

export const movementRepository = new MovementRepository();

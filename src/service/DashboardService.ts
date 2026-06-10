import { getDataSource } from '../lib/database';
import { Movement } from '../entity/Movement';
import { Product } from '../entity/Product';
import { Client } from '../entity/Client';
import { MovementType } from '../entity/MovementType';

export interface PeriodFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface DashboardKpis {
  dispatchedUnits: number;
  dispatchCount: number;
  entryCount: number;
  topClient: { clientId: string; clientName: string; totalPurchases: number } | null;
  maxStockProduct: { productId: string; productName: string; stock: number } | null;
  minStockProduct: { productId: string; productName: string; stock: number } | null;
  stockPercentage: number;
  topRotationProduct: {
    productId: string;
    productName: string;
    totalDispatched: number;
  } | null;
  rotationIndex: number;
  damagedIndex: number;
  discardRate: number;
}

class DashboardService {
  private async movementRepo() {
    return (await getDataSource()).getRepository(Movement);
  }

  private async productRepo() {
    return (await getDataSource()).getRepository(Product);
  }

  private applyPeriodFilter(
    qb: ReturnType<Awaited<ReturnType<DashboardService['movementRepo']>>['createQueryBuilder']>,
    filter?: PeriodFilter,
  ) {
    if (filter?.startDate) {
      qb.andWhere('movement.date >= :startDate', { startDate: filter.startDate });
    }
    if (filter?.endDate) {
      qb.andWhere('movement.date <= :endDate', { endDate: filter.endDate });
    }
  }

  async getDispatchedUnits(filter?: PeriodFilter): Promise<number> {
    const repo = await this.movementRepo();
    const qb = repo
      .createQueryBuilder('movement')
      .select('COALESCE(SUM(movement.quantity), 0)', 'total')
      .where('movement.type = :type', { type: MovementType.VENTA })
      .andWhere('movement.isAnnulled = false');
    this.applyPeriodFilter(qb as never, filter);
    const raw = await qb.getRawOne<{ total: string }>();
    return parseInt(raw?.total ?? '0', 10);
  }

  async getDispatchCount(filter?: PeriodFilter): Promise<number> {
    const repo = await this.movementRepo();
    const qb = repo
      .createQueryBuilder('movement')
      .where('movement.type = :type', { type: MovementType.VENTA })
      .andWhere('movement.isAnnulled = false');
    this.applyPeriodFilter(qb as never, filter);
    return qb.getCount();
  }

  async getEntryCount(filter?: PeriodFilter): Promise<number> {
    const repo = await this.movementRepo();
    const qb = repo
      .createQueryBuilder('movement')
      .where('movement.type = :type', { type: MovementType.ENTRADA })
      .andWhere('movement.isAnnulled = false');
    this.applyPeriodFilter(qb as never, filter);
    return qb.getCount();
  }

  async getTopClient(
    filter?: PeriodFilter,
  ): Promise<{ clientId: string; clientName: string; totalPurchases: number } | null> {
    const repo = await this.movementRepo();
    const qb = repo
      .createQueryBuilder('movement')
      .select('movement.clientId', 'clientId')
      .addSelect('client.name', 'clientName')
      .addSelect('SUM(movement.quantity)', 'totalPurchases')
      .innerJoin(Client, 'client', 'client.id = movement.clientId')
      .where('movement.type = :type', { type: MovementType.VENTA })
      .andWhere('movement.isAnnulled = false')
      .andWhere('movement.clientId IS NOT NULL')
      .groupBy('movement.clientId')
      .addGroupBy('client.name')
      .orderBy('SUM(movement.quantity)', 'DESC')
      .limit(1);
    this.applyPeriodFilter(qb as never, filter);
    const raw = await qb.getRawOne<{
      clientId: string;
      clientName: string;
      totalPurchases: string;
    }>();
    if (!raw?.clientId) return null;
    return {
      clientId: raw.clientId,
      clientName: raw.clientName,
      totalPurchases: parseInt(raw.totalPurchases, 10),
    };
  }

  async getMaxStockProduct(): Promise<{
    productId: string;
    productName: string;
    stock: number;
  } | null> {
    const repo = await this.productRepo();
    const product = await repo
      .createQueryBuilder('product')
      .where('product.isActive = true')
      .andWhere('product.deletedAt IS NULL')
      .orderBy('product.stock', 'DESC')
      .limit(1)
      .getOne();
    if (!product) return null;
    return { productId: product.id, productName: product.name, stock: product.stock };
  }

  async getMinStockProduct(): Promise<{
    productId: string;
    productName: string;
    stock: number;
  } | null> {
    const repo = await this.productRepo();
    const product = await repo
      .createQueryBuilder('product')
      .where('product.isActive = true')
      .andWhere('product.deletedAt IS NULL')
      .orderBy('product.stock', 'ASC')
      .limit(1)
      .getOne();
    if (!product) return null;
    return { productId: product.id, productName: product.name, stock: product.stock };
  }

  async getStockPercentage(): Promise<number> {
    const repo = await this.productRepo();
    const [withStock, total] = await Promise.all([
      repo
        .createQueryBuilder('product')
        .where('product.isActive = true')
        .andWhere('product.deletedAt IS NULL')
        .andWhere('product.stock > 0')
        .getCount(),
      repo
        .createQueryBuilder('product')
        .where('product.isActive = true')
        .andWhere('product.deletedAt IS NULL')
        .getCount(),
    ]);
    if (total === 0) return 0;
    return Math.round((withStock / total) * 100 * 100) / 100;
  }

  async getTopRotationProduct(
    filter?: PeriodFilter,
  ): Promise<{ productId: string; productName: string; totalDispatched: number } | null> {
    const repo = await this.movementRepo();
    const qb = repo
      .createQueryBuilder('movement')
      .select('movement.productId', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(movement.quantity)', 'totalDispatched')
      .innerJoin(Product, 'product', 'product.id = movement.productId')
      .where('movement.type = :type', { type: MovementType.VENTA })
      .andWhere('movement.isAnnulled = false')
      .groupBy('movement.productId')
      .addGroupBy('product.name')
      .orderBy('SUM(movement.quantity)', 'DESC')
      .limit(1);
    this.applyPeriodFilter(qb as never, filter);
    const raw = await qb.getRawOne<{
      productId: string;
      productName: string;
      totalDispatched: string;
    }>();
    if (!raw?.productId) return null;
    return {
      productId: raw.productId,
      productName: raw.productName,
      totalDispatched: parseInt(raw.totalDispatched, 10),
    };
  }

  private async getRotationIndex(filter?: PeriodFilter): Promise<number> {
    const repo = await this.movementRepo();
    const productRepo = await this.productRepo();

    const ventaQb = repo
      .createQueryBuilder('movement')
      .select('COALESCE(SUM(movement.quantity), 0)', 'total')
      .where('movement.type = :type', { type: MovementType.VENTA })
      .andWhere('movement.isAnnulled = false');
    this.applyPeriodFilter(ventaQb as never, filter);
    const ventaRaw = await ventaQb.getRawOne<{ total: string }>();
    const dispatched = parseInt(ventaRaw?.total ?? '0', 10);

    const entradaQb = repo
      .createQueryBuilder('movement')
      .select('COALESCE(SUM(movement.quantity), 0)', 'total')
      .where('movement.type = :type', { type: MovementType.ENTRADA })
      .andWhere('movement.isAnnulled = false');
    this.applyPeriodFilter(entradaQb as never, filter);
    const entradaRaw = await entradaQb.getRawOne<{ total: string }>();
    const entries = parseInt(entradaRaw?.total ?? '0', 10);

    const stockRaw = await productRepo
      .createQueryBuilder('product')
      .select('COALESCE(SUM(product.stock), 0)', 'total')
      .where('product.isActive = true')
      .andWhere('product.deletedAt IS NULL')
      .getRawOne<{ total: string }>();
    const currentStock = parseInt(stockRaw?.total ?? '0', 10);

    const beginningStock = currentStock - entries + dispatched;
    const averageStock = (beginningStock + currentStock) / 2;
    if (averageStock === 0) return 0;
    return Math.round((dispatched / averageStock) * 100) / 100;
  }

  private async getDamagedIndex(filter?: PeriodFilter): Promise<number> {
    const repo = await this.movementRepo();

    const damagedQb = repo
      .createQueryBuilder('movement')
      .select('COALESCE(SUM(movement.quantity), 0)', 'total')
      .where('movement.type IN (:...types)', { types: [MovementType.DAÑO, MovementType.VENCIMIENTO] })
      .andWhere('movement.isAnnulled = false');
    this.applyPeriodFilter(damagedQb as never, filter);
    const damagedRaw = await damagedQb.getRawOne<{ total: string }>();
    const damaged = parseInt(damagedRaw?.total ?? '0', 10);

    const allQb = repo
      .createQueryBuilder('movement')
      .select('COALESCE(SUM(movement.quantity), 0)', 'total')
      .where('movement.isAnnulled = false');
    this.applyPeriodFilter(allQb as never, filter);
    const allRaw = await allQb.getRawOne<{ total: string }>();
    const all = parseInt(allRaw?.total ?? '0', 10);

    if (all === 0) return 0;
    return Math.round((damaged / all) * 100 * 100) / 100;
  }

  private async getDiscardRate(filter?: PeriodFilter): Promise<number> {
    const repo = await this.movementRepo();
    const productRepo = await this.productRepo();

    const damagedQb = repo
      .createQueryBuilder('movement')
      .select('COALESCE(SUM(movement.quantity), 0)', 'total')
      .where('movement.type IN (:...types)', { types: [MovementType.DAÑO, MovementType.VENCIMIENTO] })
      .andWhere('movement.isAnnulled = false');
    this.applyPeriodFilter(damagedQb as never, filter);
    const damagedRaw = await damagedQb.getRawOne<{ total: string }>();
    const damaged = parseInt(damagedRaw?.total ?? '0', 10);

    const stockRaw = await productRepo
      .createQueryBuilder('product')
      .select('COALESCE(SUM(product.stock), 0)', 'total')
      .where('product.isActive = true')
      .andWhere('product.deletedAt IS NULL')
      .getRawOne<{ total: string }>();
    const totalStock = parseInt(stockRaw?.total ?? '0', 10);

    if (totalStock === 0) return 0;
    return Math.round((damaged / totalStock) * 100 * 100) / 100;
  }

  async getAllKpis(filter?: PeriodFilter): Promise<DashboardKpis> {
    const [
      dispatchedUnits,
      dispatchCount,
      entryCount,
      topClient,
      maxStockProduct,
      minStockProduct,
      stockPercentage,
      topRotationProduct,
      rotationIndex,
      damagedIndex,
      discardRate,
    ] = await Promise.all([
      this.getDispatchedUnits(filter),
      this.getDispatchCount(filter),
      this.getEntryCount(filter),
      this.getTopClient(filter),
      this.getMaxStockProduct(),
      this.getMinStockProduct(),
      this.getStockPercentage(),
      this.getTopRotationProduct(filter),
      this.getRotationIndex(filter),
      this.getDamagedIndex(filter),
      this.getDiscardRate(filter),
    ]);

    return {
      dispatchedUnits,
      dispatchCount,
      entryCount,
      topClient,
      maxStockProduct,
      minStockProduct,
      stockPercentage,
      topRotationProduct,
      rotationIndex,
      damagedIndex,
      discardRate,
    };
  }
}

export const dashboardService = new DashboardService();

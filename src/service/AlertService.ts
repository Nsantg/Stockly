import { inventoryService } from './InventoryService';
import { lotRepository } from '../repository/LotRepository';

export interface StockAlert {
  type: 'STOCK_CRITICAL';
  productId: string;
  productName: string;
  stock: number;
  minStock: number;
  message: string;
  level: 'CRITICAL';
}

export interface ExpirationAlert {
  type: 'EXPIRATION_WARNING';
  lotId: string;
  lotNumber: string;
  productId: string;
  productName: string;
  expirationDate: Date;
  daysUntilExpiration: number;
  stock: number;
  level: 'WARNING' | 'CRITICAL';
}

export interface AlertSummary {
  stockAlerts: StockAlert[];
  expirationAlerts: ExpirationAlert[];
  totalCritical: number;
  totalWarnings: number;
}

class AlertService {
  async getStockAlerts(): Promise<StockAlert[]> {
    const alerts = await inventoryService.checkStockAlerts();
    return alerts.map((a) => ({
      type: 'STOCK_CRITICAL' as const,
      productId: a.productId,
      productName: a.productName,
      stock: a.stock,
      minStock: a.minStock,
      message: a.message,
      level: 'CRITICAL' as const,
    }));
  }

  async getExpirationAlerts(daysAhead: number = 30): Promise<ExpirationAlert[]> {
    const limit = new Date();
    limit.setDate(limit.getDate() + daysAhead);

    const lots = await lotRepository.findExpiringBefore(limit);
    const today = new Date();

    const alerts: ExpirationAlert[] = lots.map((lot) => {
      const exp = new Date(lot.expirationDate as Date);
      const daysUntilExpiration = Math.ceil(
        (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        type: 'EXPIRATION_WARNING' as const,
        lotId: lot.id,
        lotNumber: lot.lotNumber,
        productId: lot.product?.id ?? lot.productId,
        productName: lot.product?.name ?? '',
        expirationDate: exp,
        daysUntilExpiration,
        stock: lot.stock,
        level: daysUntilExpiration <= 7 ? ('CRITICAL' as const) : ('WARNING' as const),
      };
    });

    return alerts.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  }

  async getAllAlerts(daysAhead: number = 30): Promise<AlertSummary> {
    const [stockAlerts, expirationAlerts] = await Promise.all([
      this.getStockAlerts(),
      this.getExpirationAlerts(daysAhead),
    ]);

    const criticalExpirations = expirationAlerts.filter((a) => a.level === 'CRITICAL').length;
    const totalCritical = stockAlerts.length + criticalExpirations;
    const totalWarnings = expirationAlerts.filter((a) => a.level === 'WARNING').length;

    return { stockAlerts, expirationAlerts, totalCritical, totalWarnings };
  }
}

export const alertService = new AlertService();

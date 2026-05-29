import { productService, CreateProductDto } from './ProductService';
import { productRepository } from '../repository/ProductRepository';
import { lotRepository } from '../repository/LotRepository';
import { Product } from '../entity/Product';
import { Lot } from '../entity/Lot';

export interface StockAlert {
  productId: string;
  productName: string;
  stock: number;
  minStock: number;
  message: string;
  level: 'CRITICAL';
}

class InventoryService {
  createProduct(dto: CreateProductDto): Promise<Product> {
    return productService.createProduct(dto);
  }

  async listInventory(): Promise<Product[]> {
    const result = await productService.getAllProducts({});
    return result.data;
  }

  async checkStockAlerts(): Promise<StockAlert[]> {
    const products = await productRepository.findBelowMinStock();
    return products.map((p) => ({
      productId: p.id,
      productName: p.name,
      stock: p.stock,
      minStock: p.minStock,
      message: `Stock crítico: ${p.name} tiene ${p.stock} unidades (mínimo: ${p.minStock})`,
      level: 'CRITICAL',
    }));
  }

  async getNextLotForDispatch(productId: string): Promise<Lot | null> {
    const lots = await lotRepository.findByProductId(productId);
    const available = lots
      .filter((lot) => lot.stock > 0 && lot.expirationDate !== null)
      .sort(
        (a, b) =>
          new Date(a.expirationDate as Date).getTime() -
          new Date(b.expirationDate as Date).getTime(),
      );
    return available[0] ?? null;
  }
}

export const inventoryService = new InventoryService();

import { z } from 'zod';
import { productRepository, ProductFilters } from '../repository/ProductRepository';
import { subcategoryRepository } from '../repository/SubcategoryRepository';
import { Product } from '../entity/Product';

export const createProductSchema = z.object({
  code: z.string().min(1, 'El código es requerido').trim(),
  name: z.string().min(1, 'El nombre es requerido').trim(),
  subcategoryId: z.string().uuid('El subcategoryId debe ser un UUID válido'),
  barcode: z.string().trim().optional().nullable(),
  serialNumber: z.string().trim().optional().nullable(),
  weight: z.number().positive('El peso debe ser un número positivo').optional().nullable(),
  requiresRefrigeration: z.boolean().optional().default(false),
  stock: z.number().int().min(0, 'El stock no puede ser negativo').default(0),
  minStock: z.number().int().min(0, 'El stock mínimo no puede ser negativo').default(0),
});

export const updateProductSchema = createProductSchema.partial();

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type CreateProductInputDto = z.input<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
}

class ProductService {
  async createProduct(dto: CreateProductInputDto): Promise<Product> {
    const data = createProductSchema.parse(dto);

    const codeExists = await productRepository.existsByCode(data.code);
    if (codeExists) {
      throw new Error(`Ya existe un producto con el código "${data.code}"`);
    }

    const subcategory = await subcategoryRepository.findById(data.subcategoryId);
    if (!subcategory) {
      throw new Error(`Subcategoría con id "${data.subcategoryId}" no encontrada`);
    }
    if (!subcategory.isActive) {
      throw new Error('La subcategoría seleccionada no está activa');
    }

    const serialNumber = subcategory.category?.allowsSerialNumber
      ? (data.serialNumber ?? null)
      : null;

    return productRepository.insert({
      ...data,
      serialNumber,
      stockBodega: data.stock,
      stockVitrina: 0,
    } as Partial<Product>);
  }

  getAllProducts(filters: ProductFilters) {
    return productRepository.findAllActive(filters);
  }

  async getProductById(id: string): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new Error(`Producto con id "${id}" no encontrado`);
    }
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.getProductById(id);
    const data = updateProductSchema.parse(dto);

    if (data.code && data.code !== product.code) {
      const codeExists = await productRepository.existsByCode(data.code, id);
      if (codeExists) {
        throw new Error(`Ya existe un producto con el código "${data.code}"`);
      }
    }

    const targetSubcategoryId = data.subcategoryId ?? product.subcategoryId;
    let subcategory = product.subcategory;

    if (data.subcategoryId && data.subcategoryId !== product.subcategoryId) {
      const found = await subcategoryRepository.findById(data.subcategoryId);
      if (!found) {
        throw new Error(`Subcategoría con id "${data.subcategoryId}" no encontrada`);
      }
      subcategory = found;
    }

    if (data.subcategoryId !== undefined || data.serialNumber !== undefined) {
      data.serialNumber = subcategory?.category?.allowsSerialNumber
        ? (data.serialNumber ?? product.serialNumber)
        : null;
    }

    return productRepository.update(id, { ...data, subcategoryId: targetSubcategoryId });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id);
    await productRepository.softDelete(id);
  }

  searchForAutocomplete(
    query: string,
    allowsSerialNumber?: boolean,
    onlyWithVentas?: boolean,
  ): Promise<Pick<Product, 'id' | 'code' | 'name'>[]> {
    return productRepository.findForAutocomplete(query.trim(), allowsSerialNumber, onlyWithVentas);
  }

  async getInventorySummary(): Promise<InventorySummary> {
    const [totalProducts, totalStock, lowStockItems] = await Promise.all([
      productRepository.countActive(),
      productRepository.getTotalStock(),
      productRepository.findBelowMinStock(),
    ]);

    return {
      totalProducts,
      totalStock,
      lowStockCount: lowStockItems.length,
    };
  }
}

export const productService = new ProductService();

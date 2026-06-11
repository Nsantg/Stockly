import { Product } from '@/entity/Product';

export const BDD_PRODUCT_ID = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
export const BDD_USER_ID = '11111111-2222-3333-4444-555555555555';
export const BDD_CLIENT_ID = '99999999-8888-7777-6666-555555555555';
export const BDD_MOVEMENT_ID = 'dddddddd-cccc-bbbb-aaaa-999999999999';
export const BDD_ADMIN_ID = '22222222-3333-4444-5555-666666666666';

interface ProductOptions {
  name: string;
  stock: number;
  categoryName: string;
  allowsSerialNumber: boolean;
}

export function buildProduct(options: ProductOptions): Product {
  return {
    id: BDD_PRODUCT_ID,
    code: 'PROD-BDD',
    name: options.name,
    stock: options.stock,
    stockBodega: options.stock,
    stockVitrina: 0,
    minStock: 10,
    isActive: true,
    subcategory: {
      id: 'sub-bdd-uuid',
      category: {
        id: 'cat-bdd-uuid',
        name: options.categoryName,
        allowsSerialNumber: options.allowsSerialNumber,
      },
    },
  } as Product;
}

export function buildElectroterapiaProduct(name: string, stock: number): Product {
  return buildProduct({
    name,
    stock,
    categoryName: 'Electroterapia',
    allowsSerialNumber: true,
  });
}

export function buildNonElectricProduct(name: string, stock: number): Product {
  return buildProduct({
    name,
    stock,
    categoryName: 'Masoterapia',
    allowsSerialNumber: false,
  });
}

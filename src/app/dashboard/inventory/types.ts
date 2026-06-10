export interface Category {
  id: string;
  name: string;
  requiresRefrigeration: boolean;
  allowsSerialNumber: boolean;
  isActive: boolean;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
  isActive: boolean;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  barcode: string | null;
  serialNumber: string | null;
  weight: number | null;
  subcategoryId: string;
  subcategory: Subcategory & { category: Category };
  requiresRefrigeration: boolean;
  stock: number;
  stockBodega: number;
  stockVitrina: number;
  minStock: number;
  isActive: boolean;
}

export interface ProductSummary {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFormData {
  code: string;
  name: string;
  barcode: string;
  serialNumber: string;
  weight: string;
  subcategoryId: string;
  requiresRefrigeration: boolean;
  stock: string;
  minStock: string;
}

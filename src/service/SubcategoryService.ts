import { z } from 'zod';
import { subcategoryRepository } from '../repository/SubcategoryRepository';
import { categoryRepository } from '../repository/CategoryRepository';
import { productRepository } from '../repository/ProductRepository';
import { Subcategory } from '../entity/Subcategory';
import { BusinessError } from '../lib/errors';

export const createSubcategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100).trim(),
  categoryId: z.string().uuid('El categoryId debe ser un UUID válido'),
});

export const updateSubcategorySchema = createSubcategorySchema.partial();

export type CreateSubcategoryDto = z.infer<typeof createSubcategorySchema>;
export type UpdateSubcategoryDto = z.infer<typeof updateSubcategorySchema>;

class SubcategoryService {
  async createSubcategory(dto: CreateSubcategoryDto): Promise<Subcategory> {
    const data = createSubcategorySchema.parse(dto);

    const category = await categoryRepository.findById(data.categoryId);
    if (!category) {
      throw new BusinessError(`Categoría con id "${data.categoryId}" no encontrada`);
    }

    const exists = await subcategoryRepository.existsByNameInCategory(
      data.name,
      data.categoryId,
    );
    if (exists) {
      throw new BusinessError(
        `Ya existe una subcategoría con el nombre "${data.name}" en esta categoría`,
      );
    }

    const subcategory = await subcategoryRepository.create(data as Partial<Subcategory>);
    return subcategoryRepository.save(subcategory);
  }

  getSubcategoriesByCategory(categoryId: string): Promise<Subcategory[]> {
    return subcategoryRepository.findByCategoryId(categoryId);
  }

  getAllSubcategories(): Promise<Subcategory[]> {
    return subcategoryRepository.findAllActive();
  }

  async getSubcategoryById(id: string): Promise<Subcategory> {
    const sub = await subcategoryRepository.findById(id);
    if (!sub) {
      throw new BusinessError(`Subcategoría con id "${id}" no encontrada`);
    }
    return sub;
  }

  async updateSubcategory(id: string, dto: UpdateSubcategoryDto): Promise<Subcategory> {
    const subcategory = await this.getSubcategoryById(id);
    const data = updateSubcategorySchema.parse(dto);

    const targetCategoryId = data.categoryId ?? subcategory.categoryId;

    if (data.categoryId && data.categoryId !== subcategory.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) {
        throw new BusinessError(`Categoría con id "${data.categoryId}" no encontrada`);
      }
    }

    const newName = data.name ?? subcategory.name;
    if (newName !== subcategory.name || targetCategoryId !== subcategory.categoryId) {
      const exists = await subcategoryRepository.existsByNameInCategory(
        newName,
        targetCategoryId,
        id,
      );
      if (exists) {
        throw new BusinessError(
          `Ya existe una subcategoría con el nombre "${newName}" en esta categoría`,
        );
      }
    }

    Object.assign(subcategory, data);
    return subcategoryRepository.save(subcategory);
  }

  async deleteSubcategory(id: string): Promise<void> {
    await this.getSubcategoryById(id);

    const products = await productRepository.findBySubcategoryId(id);
    if (products.length > 0) {
      throw new BusinessError(
        `No se puede eliminar la subcategoría porque tiene ${products.length} producto(s) activo(s)`,
      );
    }

    await subcategoryRepository.softDelete(id);
  }
}

export const subcategoryService = new SubcategoryService();

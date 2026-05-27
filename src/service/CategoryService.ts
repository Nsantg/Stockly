import { z } from 'zod';
import { categoryRepository } from '../repository/CategoryRepository';
import { subcategoryRepository } from '../repository/SubcategoryRepository';
import { Category } from '../entity/Category';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').trim(),
  requiresRefrigeration: z.boolean().optional().default(false),
  allowsSerialNumber: z.boolean().optional().default(false),
});

export const updateCategorySchema = createCategorySchema.partial();

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

class CategoryService {
  async createCategory(dto: CreateCategoryDto): Promise<Category> {
    const data = createCategorySchema.parse(dto);

    const exists = await categoryRepository.existsByName(data.name);
    if (exists) {
      throw new Error(`Ya existe una categoría con el nombre "${data.name}"`);
    }

    const category = await categoryRepository.create(data as Partial<Category>);
    return categoryRepository.save(category);
  }

  getAllCategories(): Promise<Category[]> {
    return categoryRepository.findAllActive();
  }

  async getCategoryById(id: string): Promise<Category> {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new Error(`Categoría con id "${id}" no encontrada`);
    }
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.getCategoryById(id);
    const data = updateCategorySchema.parse(dto);

    if (data.name && data.name !== category.name) {
      const exists = await categoryRepository.existsByName(data.name, id);
      if (exists) {
        throw new Error(`Ya existe una categoría con el nombre "${data.name}"`);
      }
    }

    Object.assign(category, data);
    return categoryRepository.save(category);
  }

  async deleteCategory(id: string): Promise<void> {
    await this.getCategoryById(id);

    const subcategories = await subcategoryRepository.findByCategoryId(id);
    if (subcategories.length > 0) {
      throw new Error(
        `No se puede eliminar la categoría porque tiene ${subcategories.length} subcategoría(s) activa(s)`,
      );
    }

    await categoryRepository.softDelete(id);
  }
}

export const categoryService = new CategoryService();

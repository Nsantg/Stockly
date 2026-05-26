import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { categoryService } from '../service/CategoryService';
import { subcategoryService } from '../service/SubcategoryService';
import { requireSession, requireRoles, WRITE_ROLES, READ_ROLES } from '../lib/permissions';

function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

class CategoryController {
  /**
   * @swagger
   * /api/v1/categories:
   *   get:
   *     summary: Lista todas las categorías activas
   *     tags:
   *       - Categories
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Lista de categorías
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Category'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getAll(): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const categories = await categoryService.getAllCategories();
      return NextResponse.json(categories);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/categories:
   *   post:
   *     summary: Crea una nueva categoría
   *     tags:
   *       - Categories
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCategoryDto'
   *     responses:
   *       201:
   *         description: Categoría creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Category'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async create(request: NextRequest): Promise<NextResponse> {
    const auth = await requireRoles(WRITE_ROLES);
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const category = await categoryService.createCategory(body);
      return NextResponse.json(category, { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/categories/{id}:
   *   get:
   *     summary: Obtiene una categoría por ID
   *     tags:
   *       - Categories
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Categoría encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Category'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getById(id: string): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const category = await categoryService.getCategoryById(id);
      return NextResponse.json(category);
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/categories/{id}:
   *   put:
   *     summary: Actualiza una categoría
   *     tags:
   *       - Categories
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateCategoryDto'
   *     responses:
   *       200:
   *         description: Categoría actualizada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Category'
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async update(id: string, request: NextRequest): Promise<NextResponse> {
    const auth = await requireRoles(WRITE_ROLES);
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const category = await categoryService.updateCategory(id, body);
      return NextResponse.json(category);
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/categories/{id}:
   *   delete:
   *     summary: Elimina (soft delete) una categoría
   *     tags:
   *       - Categories
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Categoría eliminada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Categoría eliminada correctamente
   *       400:
   *         $ref: '#/components/responses/ValidationError'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async remove(id: string): Promise<NextResponse> {
    const auth = await requireRoles(WRITE_ROLES);
    if (!auth.ok) return auth.response;

    try {
      await categoryService.deleteCategory(id);
      return NextResponse.json({ message: 'Categoría eliminada correctamente' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/categories/{id}/subcategories:
   *   get:
   *     summary: Lista las subcategorías de una categoría
   *     tags:
   *       - Categories
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: Lista de subcategorías
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Subcategory'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getSubcategories(categoryId: string): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const subcategories = await subcategoryService.getSubcategoriesByCategory(categoryId);
      return NextResponse.json(subcategories);
    } catch (error) {
      return handleError(error);
    }
  }
}

export const categoryController = new CategoryController();

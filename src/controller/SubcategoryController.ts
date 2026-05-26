import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { subcategoryService } from '../service/SubcategoryService';
import { requireSession, requireRoles, WRITE_ROLES } from '../lib/permissions';

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

class SubcategoryController {
  /**
   * @swagger
   * /api/v1/subcategories:
   *   get:
   *     summary: Lista subcategorías activas (con filtro opcional por categoría)
   *     tags:
   *       - Subcategories
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Filtra subcategorías por categoría
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
  async getAll(categoryId?: string): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const list = categoryId
        ? await subcategoryService.getSubcategoriesByCategory(categoryId)
        : await subcategoryService.getAllSubcategories();
      return NextResponse.json(list);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/subcategories:
   *   post:
   *     summary: Crea una nueva subcategoría
   *     tags:
   *       - Subcategories
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateSubcategoryDto'
   *     responses:
   *       201:
   *         description: Subcategoría creada exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subcategory'
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
      const subcategory = await subcategoryService.createSubcategory(body);
      return NextResponse.json(subcategory, { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/subcategories/{id}:
   *   get:
   *     summary: Obtiene una subcategoría por ID
   *     tags:
   *       - Subcategories
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
   *         description: Subcategoría encontrada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subcategory'
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
      const subcategory = await subcategoryService.getSubcategoryById(id);
      return NextResponse.json(subcategory);
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/subcategories/{id}:
   *   put:
   *     summary: Actualiza una subcategoría
   *     tags:
   *       - Subcategories
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
   *             $ref: '#/components/schemas/CreateSubcategoryDto'
   *     responses:
   *       200:
   *         description: Subcategoría actualizada
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Subcategory'
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
      const subcategory = await subcategoryService.updateSubcategory(id, body);
      return NextResponse.json(subcategory);
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/subcategories/{id}:
   *   delete:
   *     summary: Elimina (soft delete) una subcategoría
   *     tags:
   *       - Subcategories
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
   *         description: Subcategoría eliminada
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
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
      await subcategoryService.deleteSubcategory(id);
      return NextResponse.json({ message: 'Subcategoría eliminada correctamente' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrada')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }
}

export const subcategoryController = new SubcategoryController();

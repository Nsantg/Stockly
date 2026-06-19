import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { productService } from '../service/ProductService';
import { requireSession, requireRoles, WRITE_ROLES } from '../lib/permissions';
import { BusinessError } from '../lib/errors';

function handleError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Datos inválidos', details: error.flatten().fieldErrors },
      { status: 400 },
    );
  }
  if (error instanceof BusinessError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error(error);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

function isNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message.includes('no encontrado');
}

class ProductController {
  /**
   * @swagger
   * /api/v1/products:
   *   get:
   *     summary: Lista productos activos con filtros y paginación
   *     tags:
   *       - Products
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: subcategoryId
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Búsqueda parcial en código y nombre
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Lista paginada de productos
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/PaginatedProducts'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getAll(request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const { searchParams } = new URL(request.url);
      const filters = {
        categoryId: searchParams.get('categoryId') ?? undefined,
        subcategoryId: searchParams.get('subcategoryId') ?? undefined,
        search: searchParams.get('search') ?? undefined,
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 20,
      };
      const result = await productService.getAllProducts(filters);
      return NextResponse.json(result);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/products:
   *   post:
   *     summary: Crea un nuevo producto
   *     tags:
   *       - Products
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateProductDto'
   *     responses:
   *       201:
   *         description: Producto creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Product'
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
      const product = await productService.createProduct(body);
      return NextResponse.json(product, { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/products/search:
   *   get:
   *     summary: Autocompletado de productos por código o nombre
   *     tags:
   *       - Products
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Texto de búsqueda (mínimo 1 carácter)
   *     responses:
   *       200:
   *         description: Primeros 10 resultados de autocompletado
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ProductAutocomplete'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async search(request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const searchParams = new URL(request.url).searchParams;
      const q = searchParams.get('q') ?? '';
      const asnParam = searchParams.get('allowsSerialNumber');
      const allowsSerialNumber = asnParam === 'true' ? true : asnParam === 'false' ? false : undefined;
      const onlyWithVentas = searchParams.get('hasVenta') === 'true' ? true : undefined;
      const results = await productService.searchForAutocomplete(q, allowsSerialNumber, onlyWithVentas);
      return NextResponse.json(results);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/products/summary:
   *   get:
   *     summary: Resumen del inventario
   *     tags:
   *       - Products
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Totales del inventario
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InventorySummary'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getSummary(): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const summary = await productService.getInventorySummary();
      return NextResponse.json(summary);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/products/{id}:
   *   get:
   *     summary: Obtiene un producto por ID con detalle completo
   *     tags:
   *       - Products
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
   *         description: Producto encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Product'
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
      const product = await productService.getProductById(id);
      return NextResponse.json(product);
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ error: (error as Error).message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/products/{id}:
   *   put:
   *     summary: Actualiza un producto
   *     tags:
   *       - Products
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
   *             $ref: '#/components/schemas/CreateProductDto'
   *     responses:
   *       200:
   *         description: Producto actualizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Product'
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
      const product = await productService.updateProduct(id, body);
      return NextResponse.json(product);
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ error: (error as Error).message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/products/{id}:
   *   delete:
   *     summary: Elimina (soft delete) un producto
   *     tags:
   *       - Products
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
   *         description: Producto eliminado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
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
      await productService.deleteProduct(id);
      return NextResponse.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      if (isNotFoundError(error)) {
        return NextResponse.json({ error: (error as Error).message }, { status: 404 });
      }
      return handleError(error);
    }
  }
}

export const productController = new ProductController();

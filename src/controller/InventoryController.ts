import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError } from 'zod';
import { inventoryService } from '../service/InventoryService';

const createProductGuardSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
});

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
  console.error(error);
  return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
}

class InventoryController {
  /**
   * @swagger
   * /api/v1/products:
   *   post:
   *     summary: Registra un producto en el inventario
   *     tags:
   *       - Inventory
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
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async createProduct(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      createProductGuardSchema.parse(body);
      const product = await inventoryService.createProduct(body);
      return NextResponse.json(product, { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/inventory:
   *   get:
   *     summary: Consulta el inventario completo
   *     tags:
   *       - Inventory
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Lista de productos del inventario
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Product'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getInventory(_request: NextRequest): Promise<NextResponse> {
    try {
      const inventory = await inventoryService.listInventory();
      return NextResponse.json(inventory);
    } catch (error) {
      return handleError(error);
    }
  }
}

export const inventoryController = new InventoryController();

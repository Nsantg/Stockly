import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { clientService } from '../service/ClientService';
import {
  requireSession,
  requireRoles,
  WRITE_ROLES,
  CLIENT_CREATE_ROLES,
} from '../lib/permissions';
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

class ClientController {
  /**
   * @swagger
   * /api/v1/clients:
   *   get:
   *     summary: Lista todos los clientes activos
   *     tags:
   *       - Clients
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: Lista de clientes
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Client'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getAll(): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const clients = await clientService.getAllClients();
      return NextResponse.json(clients);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/clients:
   *   post:
   *     summary: Crea un nuevo cliente
   *     tags:
   *       - Clients
   *     security:
   *       - cookieAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreateClientDto'
   *     responses:
   *       201:
   *         description: Cliente creado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Client'
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
    const auth = await requireRoles(CLIENT_CREATE_ROLES);
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const client = await clientService.createClient(body);
      return NextResponse.json(client, { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/clients/search:
   *   get:
   *     summary: Busca clientes por nombre para autocompletado
   *     tags:
   *       - Clients
   *     security:
   *       - cookieAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         schema:
   *           type: string
   *         description: Texto parcial del nombre del cliente
   *     responses:
   *       200:
   *         description: Resultados de autocompletado (máximo 10)
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/ClientAutocomplete'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async search(request: NextRequest): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const { searchParams } = new URL(request.url);
      const q = searchParams.get('q') ?? '';
      const results = await clientService.searchByName(q);
      return NextResponse.json(results);
    } catch (error) {
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/clients/{id}:
   *   get:
   *     summary: Obtiene un cliente por ID
   *     tags:
   *       - Clients
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
   *         description: Cliente encontrado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Client'
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async getById(request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireSession();
    if (!auth.ok) return auth.response;

    try {
      const client = await clientService.getClientById(id);
      return NextResponse.json(client);
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/clients/{id}:
   *   put:
   *     summary: Actualiza un cliente
   *     tags:
   *       - Clients
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
   *             $ref: '#/components/schemas/CreateClientDto'
   *     responses:
   *       200:
   *         description: Cliente actualizado
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Client'
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
  async update(request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireRoles(WRITE_ROLES);
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const client = await clientService.updateClient(id, body);
      return NextResponse.json(client);
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  /**
   * @swagger
   * /api/v1/clients/{id}:
   *   delete:
   *     summary: Elimina (soft delete) un cliente
   *     tags:
   *       - Clients
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
   *         description: Cliente eliminado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Cliente eliminado correctamente
   *       401:
   *         $ref: '#/components/responses/Unauthorized'
   *       403:
   *         $ref: '#/components/responses/Forbidden'
   *       404:
   *         $ref: '#/components/responses/NotFound'
   *       500:
   *         $ref: '#/components/responses/InternalError'
   */
  async delete(request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireRoles(WRITE_ROLES);
    if (!auth.ok) return auth.response;

    try {
      await clientService.deleteClient(id);
      return NextResponse.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }
}

export const clientController = new ClientController();

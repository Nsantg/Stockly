import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { userService } from '../service/UserService';
import { requireRoles } from '../lib/permissions';
import { UserRole } from '../entity/UserRole';
const ADMIN_ONLY = [UserRole.ADMIN];

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

class UserController {
  async getUsers(): Promise<NextResponse> {
    const auth = await requireRoles(ADMIN_ONLY);
    if (!auth.ok) return auth.response;

    try {
      const users = await userService.getAllUsers();
      return NextResponse.json(users.map(({ password: _p, ...u }) => u));
    } catch (error) {
      return handleError(error);
    }
  }

  async createUser(request: NextRequest): Promise<NextResponse> {
    const auth = await requireRoles(ADMIN_ONLY);
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const user = await userService.createUser(body);
      const { password: _p, ...safeUser } = user;
      return NextResponse.json(safeUser, { status: 201 });
    } catch (error) {
      return handleError(error);
    }
  }

  async getById(_request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireRoles(ADMIN_ONLY);
    if (!auth.ok) return auth.response;

    try {
      const user = await userService.getUserById(id);
      const { password: _p, ...safeUser } = user;
      return NextResponse.json(safeUser);
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  async update(request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireRoles(ADMIN_ONLY);
    if (!auth.ok) return auth.response;

    try {
      const body = await request.json();
      const user = await userService.updateUser(id, body);
      const { password: _p, ...safeUser } = user;
      return NextResponse.json(safeUser);
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }

  async deactivate(_request: NextRequest, id: string): Promise<NextResponse> {
    const auth = await requireRoles(ADMIN_ONLY);
    if (!auth.ok) return auth.response;

    try {
      await userService.deactivateUser(id);
      return NextResponse.json({ message: 'Usuario desactivado' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('no encontrado')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return handleError(error);
    }
  }
}

export const userController = new UserController();

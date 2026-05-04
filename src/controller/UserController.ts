import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { ZodError } from 'zod';
import { userService } from '../service/UserService';
import { authOptions } from '../lib/auth';
import { UserRole } from '../entity/User';

class UserController {
  async getUsers(): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
      const users = await userService.listUsers();
      const safeUsers = users.map(({ password: _p, ...user }) => user);
      return NextResponse.json(safeUsers);
    } catch {
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
    }
  }

  async createUser(request: NextRequest): Promise<NextResponse> {
    try {
      const body = await request.json();
      const rolSolicitado: string = body.rol ?? UserRole.DESPACHADOR;

      if (rolSolicitado !== UserRole.ADMIN) {
        const session = await getServerSession(authOptions);
        if (!session) {
          return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
        if (session.user.rol !== UserRole.ADMIN) {
          return NextResponse.json(
            { error: 'Solo un Admin puede crear usuarios con este rol' },
            { status: 403 },
          );
        }
      }

      const user = await userService.createUser(body);
      const { password: _p, ...safeUser } = user;
      return NextResponse.json(safeUser, { status: 201 });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Datos inválidos', details: error.flatten().fieldErrors },
          { status: 400 },
        );
      }
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
    }
  }
}

export const userController = new UserController();

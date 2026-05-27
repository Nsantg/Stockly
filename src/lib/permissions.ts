import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { UserRole } from '../entity/UserRole';

interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
}

interface AppSession {
  user: SessionUser;
  expires: string;
}

export type AuthOk = { ok: true; session: AppSession };
export type AuthFail = { ok: false; response: NextResponse };
export type AuthResult = AuthOk | AuthFail;

export async function requireSession(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'No autorizado', details: 'Se requiere una sesión activa para acceder a este recurso' },
        { status: 401 },
      ),
    };
  }
  return { ok: true, session: session as AppSession };
}

export async function requireRoles(allowed: UserRole[]): Promise<AuthResult> {
  const result = await requireSession();
  if (!result.ok) return result;

  if (!allowed.includes(result.session.user.rol as UserRole)) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Acceso prohibido',
          details: `Esta operación requiere uno de los siguientes roles: ${allowed.join(', ')}`,
        },
        { status: 403 },
      ),
    };
  }
  return result;
}

export const READ_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.ALMACENISTA,
  UserRole.DESPACHADOR,
  UserRole.VISUALIZADOR,
];

export const WRITE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.ALMACENISTA];

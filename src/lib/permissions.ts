import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from './auth';
import { UserRole } from '../entity/UserRole';

// Tipo explícito del usuario en sesión — refleja next-auth.d.ts sin depender
// de que la augmentación sea aplicada por el compilador durante el build.
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

/** Verifica que haya una sesión activa. */
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

/** Verifica sesión activa y que el rol del usuario esté en la lista permitida. */
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

/** Roles con acceso de lectura a inventario. */
export const READ_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.ALMACENISTA,
  UserRole.DESPACHADOR,
  UserRole.VISUALIZADOR,
];

/** Roles con acceso de escritura (crear, editar, eliminar) en inventario. */
export const WRITE_ROLES: UserRole[] = [UserRole.ADMIN, UserRole.ALMACENISTA];

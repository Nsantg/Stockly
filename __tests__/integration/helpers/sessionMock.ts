import { getServerSession } from 'next-auth';
import { UserRole } from '../../../src/entity/UserRole';

interface SessionUserInput {
  id: string;
  rol: UserRole;
  email?: string;
}

export function mockSession(user: SessionUserInput): void {
  (getServerSession as jest.Mock).mockResolvedValue({
    user: {
      id: user.id,
      email: user.email ?? `${user.rol.toLowerCase()}@integration.test`,
      nombre: 'Usuario',
      apellido: 'Prueba',
      rol: user.rol,
    },
    expires: new Date(Date.now() + 86_400_000).toISOString(),
  });
}

export function mockNoSession(): void {
  (getServerSession as jest.Mock).mockResolvedValue(null);
}

export function clearSessionMock(): void {
  (getServerSession as jest.Mock).mockReset();
}

import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { getToken } from 'next-auth/jwt';
import { alertService } from '../../service/AlertService';

declare global {
  // eslint-disable-next-line no-var
  var __stocklyIO: import('socket.io').Server | undefined;
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;
  for (const part of header.split(';')) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = part.slice(0, eqIdx).trim();
    const val = part.slice(eqIdx + 1).trim();
    if (key) cookies[key] = val;
  }
  return cookies;
}

export function initSocketServer(httpServer: HttpServer): void {
  if (globalThis.__stocklyIO) return;

  const io = new Server(httpServer, {
    path: '/socket.io',
  });

  io.use(async (socket, next) => {
    try {
      // next-auth's SessionStore lee req.cookies como objeto; IncomingMessage no lo tiene.
      // Lo añadimos directamente parseando el header.
      const req = socket.request as unknown as Record<string, unknown>;
      req.cookies = parseCookieHeader(socket.request.headers.cookie);

      const token = await getToken({
        req: socket.request as Parameters<typeof getToken>[0]['req'],
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (!token) {
        return next(new Error('No autorizado'));
      }
      socket.data.user = {
        id: token.id,
        rol: token.rol,
        nombre: token.nombre,
      };
      next();
    } catch (err) {
      console.error('[socket] auth error:', err);
      next(new Error('No autorizado'));
    }
  });

  io.on('connection', async (socket) => {
    socket.join('alerts');
    try {
      const summary = await alertService.getAllAlerts();
      socket.emit('alerts:summary', summary);
    } catch (err) {
      console.error('[socket] Error sending initial summary:', err);
    }
  });

  globalThis.__stocklyIO = io;
}

export function getIO(): Server | null {
  return globalThis.__stocklyIO ?? null;
}

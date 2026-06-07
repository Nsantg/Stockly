import { createServer, IncomingMessage, ServerResponse, Server } from 'http';
import { NextRequest, NextResponse } from 'next/server';
import supertest from 'supertest';
import { POST as postMovement } from '../../../src/app/api/v1/movements/route';
import { PATCH as patchAnnulMovement } from '../../../src/app/api/v1/movements/[id]/annul/route';

let server: Server | null = null;
type SuperTestAgent = ReturnType<typeof supertest>;
let agent: SuperTestAgent | null = null;

function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function buildNextRequest(req: IncomingMessage, body: string): NextRequest {
  const url = `http://127.0.0.1${req.url ?? '/'}`;
  const hasBody = body.length > 0 && req.method !== 'GET' && req.method !== 'HEAD';

  return new NextRequest(url, {
    method: req.method,
    headers: req.headers as HeadersInit,
    body: hasBody ? body : undefined,
  });
}

async function writeNextResponse(res: ServerResponse, response: NextResponse): Promise<void> {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function routeRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readRequestBody(req);
  const pathname = new URL(`http://127.0.0.1${req.url ?? '/'}`).pathname;

  if (pathname === '/api/v1/movements' && req.method === 'POST') {
    const response = await postMovement(buildNextRequest(req, body));
    await writeNextResponse(res, response);
    return;
  }

  const annulMatch = pathname.match(/^\/api\/v1\/movements\/([^/]+)\/annul$/);
  if (annulMatch && req.method === 'PATCH') {
    const response = await patchAnnulMovement(buildNextRequest(req, body), {
      params: Promise.resolve({ id: annulMatch[1] }),
    });
    await writeNextResponse(res, response);
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ error: 'Ruta no encontrada en servidor de prueba' }));
}

export async function startTestServer(): Promise<SuperTestAgent> {
  if (agent) {
    return agent;
  }

  server = createServer((req, res) => {
    void routeRequest(req, res).catch((error) => {
      console.error('Error en adaptador HTTP de prueba:', error);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Error interno del servidor de prueba' }));
    });
  });

  await new Promise<void>((resolve) => {
    server!.listen(0, '127.0.0.1', () => resolve());
  });

  agent = supertest(server);
  return agent;
}

export async function stopTestServer(): Promise<void> {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server!.close((error) => (error ? reject(error) : resolve()));
  });

  server = null;
  agent = null;
}

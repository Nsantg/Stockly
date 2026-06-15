import 'reflect-metadata';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initSocketServer } from './src/lib/realtime/socketServer';
import { broadcastSummary } from './src/lib/realtime/alertNotifier';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT ?? '3000', 10);
const BROADCAST_INTERVAL_MS = parseInt(
  process.env.ALERTS_BROADCAST_INTERVAL_MS ?? String(15 * 60 * 1000),
  10,
);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      if (req.url?.startsWith('/socket.io')) return;
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error handling request', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  initSocketServer(httpServer);

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`Servidor listo en http://localhost:${port}`);
      fetch(`http://127.0.0.1:${port}/api/health`).catch(() => {});
      setInterval(() => {
        broadcastSummary().catch((err) =>
          console.error('[server] broadcastSummary interval error:', err),
        );
      }, BROADCAST_INTERVAL_MS);
    });
});

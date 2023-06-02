import { createServer as createViteServer } from 'vite';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

export async function ViteServer(root, context: IContext) {
  if (!context.config.explorer) return;
  const {
    console,
    config: {
      explorer: { port, base: _base },
    },
  } = context;
  const base = _base.startsWith('/') ? _base : `/${_base}`;

  const vite = await createViteServer({
    root,
    base,
    server: { middlewareMode: true },
    appType: 'spa',
  });
  const server = http.createServer(async (req, res) => {
    try {
      if (req.url === '/') {
        const indexFilePath = path.resolve(root, 'index.html');
        console.log(indexFilePath);
        const indexHtml = await vite.transformIndexHtml(
          req.url,
          fs.readFileSync(indexFilePath, 'utf-8'),
        );
        res.setHeader('Content-Type', 'text/html');
        res.end(indexHtml);
        return;
      }

      vite.middlewares(req, res, () => {
        console.log(req.url);
        res.statusCode = 404;
        res.end('Not found');
      });
    } catch (error) {
      vite.ssrFixStacktrace(error);
      console.error(error);
      res.statusCode = 500;
      res.end(error.message);
    }
  });

  server.listen(port, () => {
    console.info(`[Explorer]: Started on http://127.0.0.1:${port}`);
  });
}

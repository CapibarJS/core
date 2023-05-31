import * as http from 'node:http';
import * as path from 'node:path';
import { promises as fs } from 'node:fs';

const MIME_TYPES = {
  html: 'text/html; charset=UTF-8',
  json: 'application/json; charset=UTF-8',
  js: 'application/javascript; charset=UTF-8',
  css: 'text/css',
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const HEADERS = {
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
  'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const StaticServer = (root: string, context: IContext) => {
  if (!context.config.static) return;
  const {
    console,
    config: {
      static: { port },
    },
  } = context;

  http
    .createServer(async (req, res) => {
      const url = req.url === '/' ? '/index.html' : req.url;
      const filePath = path.join(root, url);
      try {
        const data = await fs.readFile(filePath);
        const fileExt = path.extname(filePath).substring(1);
        const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.html;
        res.writeHead(200, { ...HEADERS, 'Content-Type': mimeType });
        res.end(data);
      } catch (err) {
        res.statusCode = 404;
        res.end('"File is not found"');
      }
    })
    .listen(port);

  console.info(`Static on port ${port}`);
};

import * as http from 'node:http';
import { Transport } from './index';

// @ts-ignore
const HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubdomains; preload',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json; charset=UTF-8',
  'X-XSS-Protection': '1; mode=block',
  'X-Content-Type-Options': 'nosniff',
};

const receiveArgs = async (req) => {
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const data = Buffer.concat(buffers).toString();
  try {
    return JSON.parse(data);
  } catch (ex) {
    return { args: [] };
  }
};

export const HttpTransport = (transport: Transport) => {
  http
    .createServer(async (req, res) => {
      const { url, socket } = req;
      const [place, ...pathParams] = url?.substring(1).split('/') ?? [];
      const ip = socket.remoteAddress;
      res.writeHead(200, HEADERS);
      try {
        if (
          req.method === 'GET' &&
          transport.app.emitter.listenerCount('http:get')
        )
          return transport.app.emitter.emit('http:get', {
            req,
            res,
            pathParams,
          });
      } catch {}
      if (req.method !== 'POST') {
        res.writeHead(404);
        return res.end('"Not found"');
      }
      if (place !== 'api') return res.end('"Not found"');
      const { args, name: namespace, method } = await receiveArgs(req);
      args.push(pathParams);
      let handler;
      try {
        handler = transport.getHandler(namespace, method);
      } catch (err) {
        transport.writeLogError(ip, namespace, method, args, err);
        return res.end(String(err));
      }
      transport.writeLogSuccess(ip, namespace, method, args);
      try {
        const result = await handler(...args);
        res.end(JSON.stringify(result));
      } catch (err) {
        transport.writeLogError(ip, namespace, method, args, err);
        res.end(String(err));
      }
    })
    .listen(transport.port);
};
export default HttpTransport;

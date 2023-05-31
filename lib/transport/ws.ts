import { Transport } from './index';

const { Server } = require('ws');

export const WSTransport = (transport: Transport) => {
  const { port } = transport;
  const ws = new Server({ port });
  ws.on('connection', (connection, req) => {
    const ip = req.socket.remoteAddress;
    connection.on('message', async (message) => {
      const obj = JSON.parse(String(message));
      const { name: namespace, method, args = [] } = obj;
      let handler;
      try {
        handler = transport.getHandler(namespace, method);
      } catch (err) {
        transport.writeLogError(ip, namespace, method, args, err);
        return connection.send(err, { binary: false });
      }
      transport.writeLogSuccess(ip, namespace, method, args);
      try {
        const result = await handler(...args);
        connection.send(JSON.stringify(result), { binary: false });
      } catch (err) {
        transport.writeLogError(ip, namespace, method, args, err);
        connection.send(err, { binary: false });
      }
    });
  });
};
export default WSTransport;

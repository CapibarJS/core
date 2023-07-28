import * as fs from 'node:fs';
import { basename, join } from 'node:path';
import { Application } from '../application';

const AvailableTransports = fs
  .readdirSync(__dirname)
  .filter((x) => x.endsWith('.js') && x !== 'index.js')
  .map((x) => basename(x, '.js'));

export class Transport {
  private type: string;
  console: IContext['console'];
  port: number;

  constructor(type: ITransportType, public app: Application) {
    const context = app.getContext();
    this.type = type;
    this.console = context.console;
    if (!context.config.network?.[type])
      this.console.error(
        `${type} transport is not declared in config.network.${type}`,
      );
    this.port = context.config.network?.[type]?.port;

    let pluginPath = context.config.network[type]?.pluginPath;
    pluginPath = pluginPath
      ? join(process.cwd(), context.config.network[type]?.pluginPath)
      : undefined;

    if (AvailableTransports.includes(type) || fs.existsSync(pluginPath)) {
      require(pluginPath ?? `./${type}.js`).default(this);
    } else {
      this.console.error(`Plugin ${pluginPath} not found`);
    }
    this.console.info(
      `[${type.toUpperCase()}]: Started on http://127.0.0.1:${this.port}`,
    );
  }

  getHandler(namespace: string, method: string) {
    this.app.emitter.emit('transport:getHandler', {
      transport: this,
      namespace,
      method,
    });
    return this.app.getMethod(method, namespace);
  }

  writeLogSuccess(
    address: string,
    namespace: string,
    method: string,
    args: any,
  ) {
    // @ts-ignore
    const params = JSON.stringify(...args);
    this.console.log(
      `[${this.type.toUpperCase()}]: ${address} ${namespace}.${method}(${params})`,
    );
  }

  writeLogError(
    address: string,
    namespace: string,
    method: string,
    args: any,
    error: string,
  ) {
    // @ts-ignore
    const params = JSON.stringify(...args);
    this.console.error(
      `[${this.type.toUpperCase()}]: ${address} ${namespace}.${method}(${params})`,
      error,
    );
  }

  static create(type: ITransportType, app: Application) {
    new Transport(type, app);
  }

  static createFactory(app: Application) {
    const networks = app.getContext().config.network;
    const types = Object.keys(networks) as ITransportType[];
    for (const type of types) {
      Transport.create(type, app);
    }
  }
}

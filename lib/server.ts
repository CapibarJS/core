import { join } from 'node:path';
import config from './config';
import { db } from './db';
import { Application } from './application';
import { Logger } from './logger';
import defines from './common/defines';
import { Transport } from './transport';
import { StaticServer } from './static';
import { ViteServer } from './static/vite';

type IServerOptions = {
  rootDir?: string;
} & Partial<IContext> &
  Record<string, any>;

export class Server {
  app: Application;
  staticDir: string;
  private readonly explorerDir: string;

  constructor(options: IServerOptions = {}) {
    options.rootDir = options?.rootDir ?? 'app';
    const { rootDir, ...context } = options;
    if (!context?.config) context.config = {};
    if (!context.config.explorer && context.config.explorer !== false)
      context.config.explorer = { port: 8080, base: 'api' };
    if (!context.config.network)
      context.config.network = { http: { port: 3000 } };

    this.staticDir = join(rootDir, './static');
    // this.explorerDir = join(require.resolve('@capibar/explorer'), '../dist');
    this.explorerDir = join(
      require.resolve('D:/Projects/CapibarJS/explorer'),
      '../dist',
    );

    this.app = new Application(
      {
        db: db(config),
        config,
        console: Logger.create('log'),
        ...defines,
        ...context,
      },
      rootDir,
    );
  }
  async start() {
    await this.app.init();
    Transport.createFactory(this.app);
    StaticServer(this.explorerDir, this.app.getContext());
    await ViteServer(this.explorerDir, this.app.getContext(), this.app);
  }
}

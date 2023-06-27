import { join } from 'node:path';
import config from './config';
import { db } from './db';
import { Application } from './application';
import { Logger } from './logger';
import defines from './common/defines';
import { Transport } from './transport';
import { StaticServer } from './static';

type IServerOptions = {
  rootDir?: string;
} & Partial<IContext> &
  Record<string, any>;

export class Server {
  app: Application;
  staticDir: string;

  constructor(options: IServerOptions = {}) {
    options.rootDir = options?.rootDir ?? 'app';
    const { rootDir, ...context } = options;
    if (!context?.config) context.config = {};
    if (!context.config.network)
      context.config.network = { http: { port: 3000 } };

    this.staticDir = join(require.resolve('@capibar/explorer'), '../dist');

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
    StaticServer(this.staticDir, this.app.getContext(), (req, res) => {
      res.setHeader(
        'Set-Cookie',
        `meta=${JSON.stringify(this.app.getApiMeta)}; Path=/`,
      );
    });
  }
}

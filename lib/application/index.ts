import { Loader } from './loader';
import { Modules } from './module';
import { Schemas } from './schemas';
import { Plugins } from './plugins';
import { version } from '../../package.json';
import { EventEmitter } from '../events';

export class Application extends Loader {
  api: Modules;
  schemas: Schemas;
  emitter: EventEmitter;

  constructor(protected context: IContext, protected root = 'app') {
    super(root);
    this.emitter = new EventEmitter(this);
    this.context.api = {};
    this.context.schemas = {};
    this.context.config.PATH = {
      api: 'api',
      schemas: 'schemas',
      plugins: 'plugins',
      config: 'config',
    };
    this.context.load = this.context?.load ?? this.load.bind(this);
  }

  async init() {
    new Plugins(this, this.context);
    this.schemas = new Schemas(this, this.context);
    this.api = new Modules(this, this.context);
    this.emitter.emit('application:initiated');
  }

  getMethod(method: string, namespace?: string) {
    if (namespace === '_' && method === 'introspect')
      return (args) => this.introspect(args);
    const procedure = this.api.proceduresPublic.find(
      (x) => x.namespace === namespace && x.name === method,
    );
    if (!procedure)
      throw `"Handler ${method} not found in namespace ${namespace}"`;
    return procedure.getMethod();
  }

  async introspect(options: any = {}) {
    const structure = {};
    const hiddenOptions = options?.typing !== true;
    // console.log(
    //   this.api.procedures.map((x) => ({
    //     path: x.namespace + '.' + x.name,
    //     private: x.private,
    //   })),
    // );
    for (const procedure of this.api.proceduresPublic.filter(
      (x) => x.private !== true,
    )) {
      const key = [procedure.namespace, procedure.name].join('.');
      if (hiddenOptions) {
        structure[key] = {};
        continue;
      }
      structure[key] = procedure.toObject();
    }
    if (!hiddenOptions) {
      structure['#api'] = {};
      for (const config of this.api.configs) {
        structure['#api'][config.namespace] = {
          meta: config.exports.meta ?? {},
        };
      }
      structure['#schemas'] = {};
      const records = structure['#schemas'];
      for (const schema of this.schemas.schemas) {
        records[schema.path] = schema.toObject();
      }
    }
    return structure;
  }

  getContext() {
    return this.context;
  }

  get config() {
    return this.context.config;
  }

  get getApiMeta() {
    const meta: Record<string, any> = {};
    meta.clients = Object.keys(this.config.network).map((key) => {
      const { port } = this.config.network[key];
      return { name: key, port };
    });
    return { meta, ...this.context.meta, coreVersion: version };
  }
}

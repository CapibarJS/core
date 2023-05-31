import { Loader } from './loader';
import { Modules } from './module';
import { Schemas } from './schemas';
import { Plugins } from './plugins';

export class Application extends Loader {
  api: Modules;
  schemas: Schemas;

  constructor(protected context: IContext, protected root = 'app') {
    super(root);
    this.context.api = {};
    this.context.schemas = {};
    this.context.config.PATH = {
      api: 'api',
      schemas: 'schemas',
      plugins: 'plugins',
      config: 'config',
    };
  }

  async init() {
    this.schemas = new Schemas(this, this.context);
    this.api = new Modules(this, this.context);
    new Plugins(this, this.context);
  }

  getMethod(method: string, namespace?: string) {
    if (namespace === '_' && method === 'introspect')
      return (args) => this.introspect(args);
    const procedure = this.api.procedures.find(
      (x) => x.namespace === namespace && x.name === method,
    );
    if (!procedure)
      throw `"Handler ${method} not found in namespace ${namespace}"`;
    return procedure.getMethod();
  }

  async introspect(options: any = {}) {
    const structure = {};
    const hiddenOptions = options?.typing !== true;
    for (const procedure of this.api.procedures) {
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
          meta: config.exports.meta,
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
}

import { Application } from './index';
import { VmConfig, VmConfigExports, VmFunction } from '../vm';
import { objectSet } from '../common/utils';
import { Procedure } from '../vm/procedure';

function uniqueBy(a, cond) {
  return a.filter((e, i) => a.findIndex((e2) => cond(e, e2)) === i);
}
const uniqueByField = (a, field) =>
  uniqueBy(a, (x, y) => x[field] === y[field]);

export class Modules {
  procedures: Procedure[] = [];
  configs: VmConfig[] = [];

  constructor(protected app: Application, protected context: IContext) {
    this.init();
  }

  get proceduresPublic() {
    const configsPrivate = Object.fromEntries(
      this.configs.map((x) => [x.namespace, !!x.exports.private]),
    );
    return this.procedures.filter((x) => {
      const isPublic = !configsPrivate[x.namespace];
      const isPublicProcedure = x.private === undefined ? isPublic : !x.private;
      return isPublicProcedure || isPublic;
    });
  }

  protected init() {
    const files = this.app.filesByType('config', 'function');
    // Init configs and crud operations
    for (const file of files.filter((x) => x.type === 'config')) {
      const vm = VmConfig.create(file.resolve, this.context);
      this.configs.push(vm);
      const config = vm.build();
      const crud = this.generateCrudApi(config);
      for (const [name, method] of crud.entries()) {
        const procedure = this.getProcedureFromCrud(
          name,
          vm.namespace,
          method,
          config,
        );
        this.procedures.push(procedure);
        objectSet(
          this.context.api,
          [vm.namespace, name].join('.'),
          procedure.getMethod(),
        );
      }
    }

    // Init unresolved configs
    const filesWithoutConfig = files
      .filter((x) => x.type !== 'config')
      .filter(
        (x) => !this.configs.some(({ namespace }) => namespace === x.namespace),
      );
    uniqueByField(filesWithoutConfig, 'namespace').forEach((file) => {
      const configNamespace = file.fullName.split('.').slice(0, -1).join('.');
      if (this.configs.filter((x) => x.namespace !== configNamespace)) {
        const config = VmConfig.createEmpty();
        config.name = 'index';
        config.namespace = configNamespace;
        config.exports = { meta: {} };
        this.configs.push(config);
      }
    });

    // Init procedures
    for (const file of files.filter((x) => x.type !== 'config')) {
      const vm = VmFunction.create(file.resolve, this.context);
      this.procedures.push(vm.procedure);
      objectSet(this.context.api, file.fullName, vm.build());
    }
  }

  protected generateCrudApi(config: VmConfigExports) {
    const generated = new Map<string, any>();
    if (config?.crud === undefined) return generated;
    const { crud } = this.context;
    const crudOperations = Object.keys(crud ?? {});
    const onlyOperations = config?.crud?.only ?? crudOperations;
    const excludeOperations = config?.crud?.exclude ?? [];
    const operation = crudOperations
      .filter((x) => onlyOperations.includes(x))
      .filter((x) => !excludeOperations.includes(x));
    const getOperation = (operation) => (entity) =>
      crud?.[operation](entity, {
        app: this.app,
        operation,
        crudConfig: config,
      });
    operation.forEach((o) => generated.set(o, getOperation(o)));
    return generated;
  }

  protected getProcedureFromCrud(name, namespace, method, config) {
    let procedure: Procedure;
    const define = method(config.Entity);
    if (typeof define === 'function') {
      const crudMethod = (params: any) => method(config.Entity)(params);
      procedure = new Procedure(crudMethod, {
        name,
        namespace,
        meta: { name },
      });
    } else {
      procedure = Procedure.createFrom(define, { name, namespace });
    }
    return procedure;
  }
}

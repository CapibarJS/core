import { Application } from './index';
import { VmConfig, VmConfigExports, VmFunction } from '../vm';
import { objectSet } from '../common/utils';
import { Procedure } from '../vm/procedure';

export class Modules {
  procedures: Procedure[] = [];
  configs: VmConfig[] = [];

  constructor(protected app: Application, protected context: IContext) {
    const files = this.app.filesByType('config', 'function');
    for (const file of files) {
      if (file.type === 'config') {
        const vm = VmConfig.create(file.resolve, context);
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
            context.api,
            [vm.namespace, name].join('.'),
            procedure.getMethod(),
          );
        }
        continue;
      }
      const vm = VmFunction.create(file.resolve, context);
      {
        const configNamespace = file.fullName.split('.').slice(0, -1).join('.');
        if (this.configs.filter((x) => x.namespace !== configNamespace)) {
          const config = VmConfig.createEmpty();
          config.name = 'index';
          config.namespace = configNamespace;
          config.exports = { meta: {} };
          this.configs.push(config);
        }
      }
      this.procedures.push(vm.procedure);
      objectSet(context.api, file.fullName, vm.build());
    }
  }

  protected generateCrudApi(config: VmConfigExports) {
    const generated = new Map<string, any>();
    const { crud } = this.context;
    const crudOperations = Object.keys(crud ?? {});
    const onlyOperations = config?.crud?.only ?? crudOperations;
    const excludeOperations = config?.crud?.exclude ?? [];
    const operation = crudOperations
      .filter((x) => onlyOperations.includes(x))
      .filter((x) => !excludeOperations.includes(x));
    const getOperation = (operation) => (entity) => crud?.[operation](entity);
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

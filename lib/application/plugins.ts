import { Application } from './index';
import { VmPlugin } from '../vm/types/vm-plugin';

export class Plugins {
  plugins: VmPlugin[] = [];

  constructor(protected app: Application, protected context: IContext) {
    const files = this.app.filesByType('plugin');
    for (const file of files) {
      const vm = VmPlugin.create(file.resolve, context);
      this.plugins.push(vm);
      const plugin = vm.build();
      plugin(app, context);
    }
  }
}

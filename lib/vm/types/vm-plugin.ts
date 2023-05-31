import { VmModule } from '../module';
import { Application } from '../../application';

export type VmPluginExports = {
  setup: (app: Application, ctx: IContext) => Promise<void> | void;
};

export class VmPlugin extends VmModule {
  declare exports: VmPluginExports;
  constructor(resolve: string, context: IContext) {
    super(resolve, context);
  }

  static create(resolve: string, context: IContext) {
    return new VmPlugin(resolve, context);
  }

  /**
   * Plugin
   * @description Load props from `exports`
   */
  build() {
    const { setup } = this.exports;
    if (!setup) {
      throw new SyntaxError(
        `File ${this.name}.js does not contain 'setup' function [File ${this.resolve}]`,
      );
    }
    return setup;
  }
}

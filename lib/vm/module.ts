import type {
  Context,
  RunningScriptOptions,
  Script,
  ScriptOptions,
} from 'node:vm';
import * as vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

export class VmModule {
  namespace: string;
  name: string;
  protected script: Script;
  protected vmContext: Context;
  protected runOptions: RunningScriptOptions;
  protected exports: any;

  constructor(protected resolve: string, protected context: IContext) {
    const options = context.config.runOptions;
    this.name = options?.filename ?? basename(this.resolve, '.js');
    const source = this.read(resolve);
    const code = `'use strict';\n${source}`;
    this.runOptions = { ...options };
    const vmScriptOptions: ScriptOptions = {
      filename: this.name,
      ...options,
    };
    this.script = new vm.Script(code, vmScriptOptions);
    this.vmContext = vm.createContext(context);
    try {
      this.exports = this.script.runInContext(this.vmContext, this.runOptions);
    } catch (ex) {
      context.console.error('[VmModule]', String(ex), `(${resolve})`);
      throw ex;
    }
    {
      const resolveArray = this.resolve.split('/');
      resolveArray.pop();
      const paths = Object.keys(context.config.PATH);
      const firstIndex = resolveArray.findIndex((x) => paths.includes(x)) + 1;
      const parents = resolveArray.slice(firstIndex);
      this.namespace = parents.join('.');
      if (!this.namespace) this.namespace = undefined;
    }
  }

  /**
   * Create new instance (constructor)
   * @param resolve
   * @param context
   */
  static create(resolve: string, context: IContext) {
    return new VmModule(resolve, context);
  }

  /**
   * @interface
   * Execute script in context
   */
  build(): Promise<any> | any {
    return this.exports;
  }

  protected read(resolve: string) {
    let src = readFileSync(resolve, { encoding: 'utf8' });
    if (!src.length) throw new SyntaxError(`File ${resolve} is empty`);
    const regExp = new RegExp(/^(?<define>define\w+)/gm);
    const match = Array.from(src.matchAll(regExp))?.[0];
    if (match?.groups?.define) {
      src = src.replaceAll(match.groups.define, '');
    }
    return src;
  }
}

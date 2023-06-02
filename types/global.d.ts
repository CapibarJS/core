import defines, { IDefines } from '../lib/common/defines';
import { RunningScriptOptions, ScriptOptions } from 'node:vm';
import { Schema } from '../lib/schema';
import { STRUCTURE_TYPES } from '../lib/application/loader';

export {};
declare global {
  export type IStructureType = (typeof STRUCTURE_TYPES)[number];

  type ITransportType = 'http' | 'ws' | string;

  type IDatabase = any;
  type ICrud = any;
  type IConfigStatic = {
    host?: string;
    port: number;
  };
  type IConfigExplorer = {
    port?: number;
    base?: string;
  };
  type IConfigNetwork = Partial<
    Record<ITransportType, { port: number; pluginPath?: string }>
  >;

  type IContext = {
    console?: Partial<Console>;
    api?: any;
    schemas?: any;
    config: IConfig;
    db?: IDatabase;
    crud?: ICrud;
  } & Partial<IDefines>;

  type IConfig = {
    PATH?: Record<IStructureType, IStructureType | string>;
    static?: IConfigStatic;
    explorer?: IConfigExplorer | false;
    network?: IConfigNetwork;
    runOptions?: ScriptOptions & RunningScriptOptions;
  };

  type ISchema = Schema;

  namespace api {}
  namespace db {}
  namespace config {}
  namespace schemas {}

  const defineSchema: typeof defines.defineSchema;
  const defineApi: typeof defines.defineApi;
  const defineConfig: typeof defines.defineConfig;
  const definePlugin: typeof defines.definePlugin;
}

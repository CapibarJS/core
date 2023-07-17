import defines, { IDefines } from '../lib/common/defines';
import { RunningScriptOptions, ScriptOptions } from 'node:vm';
import { Schema } from '../lib/schema';
import { STRUCTURE_TYPES } from '../lib/application/loader';

export {};
declare global {
  export type IStructureType = (typeof STRUCTURE_TYPES)[number];

  type ITransportType = 'http' | 'ws' | string;

  export type IEventName =
    | 'application:initiated'
    | 'schemas:initiated'
    | 'transport:getHandler';

  type IDatabase = any;
  type ICrud = any;
  type IConfigStatic = {
    host?: string;
    port: number;
  };
  type IConfigNetwork = Partial<
    Record<ITransportType, { port: number; pluginPath?: string }>
  >;
  type IMeta = Partial<{
    name: string;
    description: string;
    version: string;
    [key: string]: any;
  }>;

  type IContext = {
    console?: Partial<Console>;
    api?: any;
    schemas?: any;
    config: IConfig;
    db?: IDatabase;
    crud?: ICrud;
    meta?: IMeta;
  } & Partial<IDefines>;

  type IConfig = {
    PATH?: Record<IStructureType, IStructureType | string>;
    static?: IConfigStatic;
    network?: IConfigNetwork;
    runOptions?: ScriptOptions & RunningScriptOptions;
  };

  type ISchema = Schema;
  const Schema: Schema;

  namespace api {}
  namespace db {}
  namespace config {}
  namespace schemas {}

  const defineSchema: typeof defines.defineSchema;
  const defineApi: typeof defines.defineApi;
  const defineConfig: typeof defines.defineConfig;
  const definePlugin: typeof defines.definePlugin;
}

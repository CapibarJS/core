import { ISchemaDefine, Schema } from '../schema';
import { VmConfigExports, VmFunctionExports } from '../vm';
import { VmPluginExports } from '../vm/types/vm-plugin';

export const defineSchema = (schema: ISchemaDefine) => new Schema(schema);
export const defineApi = (struct: VmFunctionExports) => struct;
export const defineConfig = (config: VmConfigExports) => config;
export const definePlugin = (config: VmPluginExports) => config;

const defines = {
  defineSchema,
  defineApi,
  defineConfig,
  definePlugin,
};
export type IDefines = typeof defines;
export default defines;

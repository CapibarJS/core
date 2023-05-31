import { Schema } from '../schema';
import { VmFunctionExports } from './types';

type CreateProcedureFromOptions = {
  name?: string;
  namespace?: string;
};

type IProcedureMethod = (...args) => Promise<any> | any;

export type IProcedureMeta = {
  name?: string;
  description?: string;
};

export type IProcedureOptions = {
  schemaRequest?: Schema;
  schemaResponse?: Schema;
  name?: string;
  namespace?: string;

  meta?: IProcedureMeta;
};

export class Procedure {
  name: string;
  namespace?: string;

  schemaRequest?: Schema;
  schemaResponse?: Schema;

  meta: IProcedureMeta;

  constructor(
    private method: IProcedureMethod,
    options: IProcedureOptions = {},
  ) {
    this.schemaRequest = options?.schemaRequest ?? Schema.fromArray([]);
    this.schemaResponse = options?.schemaResponse ?? Schema.fromArray([]);
    this.name = options?.name;
    this.namespace = options?.namespace;
    this.meta = options?.meta ?? {};
  }

  getMethod(): IProcedureMethod {
    const method = async (args = {}) => {
      let payload = args;
      if (this.schemaRequest.fields.length) {
        const _args = this.schemaRequest.transform(payload, {
          parseOrField: true,
        });
        const validate = this.schemaRequest.validate(_args);
        if (!validate.valid) throw validate.toError();
        payload = _args;
      }
      const response = await this.method(payload);
      return this.schemaResponse.fields.length
        ? this.schemaResponse.transform(response)
        : response;
    };
    return method.bind(this);
  }

  toObject() {
    const toSchema = (schema: Schema) =>
      schema.name ? { ['#ref']: schema.path } : schema.toObject();
    return {
      params: toSchema(this.schemaRequest),
      returns: toSchema(this.schemaResponse),
      meta: this.meta,
    };
  }

  static createFrom(
    exports: VmFunctionExports,
    options: CreateProcedureFromOptions = {},
  ) {
    const { method, params, returns, Function } = exports;
    const meta = Function ?? {};
    meta.name = meta?.name ?? options.name;

    const [schemaRequest, schemaResponse] = Schema.schemasFrom(params, returns);
    return new Procedure(method, {
      name: options.name,
      namespace: options.namespace,
      schemaRequest,
      schemaResponse,
      meta,
    });
  }
}

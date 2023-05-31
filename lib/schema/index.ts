import * as v8 from 'v8';
import { ISchemaFieldDef, SchemaField } from './field';
import { SchemaError } from './error';
import { capitalizeFirst, toESType } from '../common/utils';

const structuredClone = (obj) => {
  return v8.deserialize(v8.serialize(obj));
};

type ISchemaOptions = Partial<{
  name: string;
  description: string;
}>;

export type ISchemaDefine = {
  Schema?: string | ISchemaOptions;
  [k: string]: ISchemaFieldDef | ISchemaOptions | string;
};

export type ISchemaTransformOptions = Partial<{
  /**
   * @default false
   * @description If parsing failed, then return the original field
   */
  parseOrField: boolean;
  /**
   * @default false
   * @description Delete unknown fields from source data
   */
  extractUnknown: boolean;
}>;

export class Schema {
  name: string;
  options: ISchemaOptions = {};
  fields: SchemaField[] = [];

  constructor(raw: ISchemaDefine, public namespace?: string) {
    let entries = Object.entries(raw);
    const schemaOptions = entries.find(
      ([key]) => key === 'Schema',
    )?.[1] as ISchemaOptions;
    if (typeof schemaOptions === 'string') this.name = schemaOptions;
    else {
      const { name: schemaName, ...options } = schemaOptions ?? {};
      this.name = schemaName;
      this.options = { ...this.options, ...options };
    }
    this.name = capitalizeFirst(this.name);
    entries = entries.filter(([key]) => key !== 'Schema');
    for (const [key, value] of entries) {
      this.fields.push(SchemaField.setup(key, value as ISchemaFieldDef));
    }
  }
  get path() {
    return [this.namespace, this.name].filter((x) => x).join('.');
  }

  static fromArray(array: string[], namespace?: string) {
    const fields = [];
    for (const field of array) {
      if (typeof field === 'string') fields.push(field.split(':'));
      else fields.push(field);
    }
    return new Schema({ ...Object.fromEntries(fields) }, namespace);
  }

  validate(data, namespace?: string, parent?: string) {
    const schemaError = new SchemaError(this.name, namespace, parent);
    if (typeof data !== 'object' || !data) {
      schemaError.error('Data must be an object');
      return schemaError;
    }
    this.fields.forEach((field) => field.validate(data, schemaError));
    return schemaError;
  }

  transform(data, options: ISchemaTransformOptions = {}) {
    const struct = structuredClone(data);
    const schemaFields = this.fields.map((x) => x.name);
    options.extractUnknown = options?.extractUnknown ?? true;
    if (options?.extractUnknown) {
      Object.keys(struct).forEach(
        (key) => !schemaFields.includes(key) && delete struct[key],
      );
    }
    if (typeof struct !== 'object' || !struct) return struct;
    this.fields.forEach((field) => field.transform(struct, options));
    return struct;
  }

  toObject() {
    const { name, fields } = this;
    return {
      name,
      meta: this.options,
      fields: fields.map((x) => x.toObject()),
    };
  }

  toInterface() {
    const { name, fields } = this;
    const types = [];
    types.push(`interface ${name} {`);
    for (const { name, options: opt } of fields) {
      const { type } = opt;
      if (type) {
        const q = opt.required ? '' : '?';
        const isArray = opt.isArray ? '[]' : '';
        // const isSchema = isFirstUpper(type);
        const fieldName = name;
        const esType = toESType(type);
        types.push(`  ${fieldName}${q}: ${esType}${isArray};`);
      }
    }
    types.push('}');
    return types.join('\n');
  }

  static schemasFrom(...defs): Schema[] {
    const schemas = [];
    for (const def of defs) {
      if (def instanceof Schema) schemas.push(def);
      else if (Array.isArray(def)) schemas.push(Schema.fromArray(def));
    }
    return schemas;
  }
}

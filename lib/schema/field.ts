import { SchemaError } from './error';
import { ISchemaTransformOptions, Schema } from './index';
import { Parse } from './parser';
import { validator } from './validator';

type ISchemaFieldTypeNumber = 'number' | 'int' | 'float';
type ISchemaFieldType =
  | ISchemaFieldTypeNumber
  | 'string'
  | 'boolean'
  | 'date'
  | 'schema'
  | 'object'
  | 'unknown';
export type ISchemaFieldOptions = Partial<{
  type: ISchemaFieldType;
  schema: Schema;
  required: boolean;
  isArray: boolean;

  // String
  minLength: number;
  maxLength: number;
  pattern: RegExp;

  // Number & Date
  min: number | Date;
  max: number | Date;

  // Boolean
  allowNull: boolean;
}>;
export type ISchemaFieldDef = ISchemaFieldType | ISchemaFieldOptions;

export class SchemaField {
  options: ISchemaFieldOptions = {};
  isNested = false;
  constructor(public name: string, defs: ISchemaFieldDef) {
    if (typeof defs === 'string') {
      this.options.required = true;
      let strDef = defs as string;
      if (strDef.endsWith('[]')) {
        this.options.isArray = true;
        strDef = strDef.slice(0, -2);
      }
      if (strDef.startsWith('!') || strDef.startsWith('?')) {
        this.options.required = strDef?.substring(0, 1) !== '?';
        strDef = strDef.slice(1);
      }
      this.options.type = strDef as ISchemaFieldType;
    } else if (typeof defs === 'object') {
      let defSchema: any = defs;
      if (defs instanceof Schema) {
        defSchema = { schema: defs };
        this.isNested = true;
      } else if ('schema' in defs) {
        defSchema = defs;
        this.isNested = true;
      }
      // else {
      //   defSchema.schema = new Schema({ ...(defs as any) });
      //   this.isNested = true;
      // }
      this.options = { required: true, ...defSchema };
    } else {
      this.options.type = 'unknown';
    }
  }

  static setup(name: string, defs: ISchemaFieldDef) {
    return new SchemaField(name, defs);
  }

  validate(data: any, schemaError: SchemaError) {
    const value = data[this.name];
    const type = this.options.type;
    const isRequired = this.options.required;
    const isValueMissing = value === undefined || value === null;
    const reject = schemaError.addErrorFunc(this.name);

    if (isRequired && isValueMissing) {
      reject('is required');
      return;
    }
    if (!isRequired && isValueMissing) return;

    if (this.options.isArray && !Array.isArray(value)) {
      reject('must be an array');
      return;
    }
    const validate = (val, idx = undefined) => {
      const addError = (err: any, _f = undefined) => {
        const error =
          idx !== undefined && typeof err === 'string'
            ? `at [${idx}] ${err}`
            : err;
        reject(error, _f);
      };
      if (this.isNested) {
        const schema = this.options.schema;
        if (typeof val !== 'object') {
          addError('Data must be an object');
        } else {
          const { errors } = schema.validate(
            value,
            this.name,
            schemaError.namespace,
          );
          schemaError.add(errors);
        }
      }
      validator(addError, val, type, this.options);
    };

    try {
      if (this.options.isArray && Array.isArray(value))
        value.forEach((v, idx) => validate(v, idx));
      else validate(value);
    } catch (ex) {
      console.error('[SchemaField error] validate:', String(ex));
      throw ex;
    }
  }

  transform(data: any, options: ISchemaTransformOptions) {
    const value = data[this.name];
    const type = this.options.type;
    const defaultValue = options?.parseOrField ? value : undefined;
    const transform = (val, idx = undefined) => {
      let res;
      if (this.isNested) {
        const schema = this.options.schema;
        res = val ? schema.transform(val, options) : undefined;
      }
      if (type === 'string')
        res = val !== undefined && val !== null ? String(val) : undefined;
      if (type === 'int') res = Parse.Int(val);
      if (type === 'number' || type === 'float') res = Parse.Float(val);
      if (type === 'boolean') res = Parse.Boolean(val);
      if (type === 'date') res = Parse.Date(val);
      if (res === undefined) res = defaultValue?.[idx] ?? defaultValue;
      return res;
    };
    try {
      if (this.options.isArray && Array.isArray(value)) {
        data[this.name] = value.map((v, idx) => transform(v, idx));
      } else {
        data[this.name] = transform(value);
      }
    } catch (ex) {
      console.error('[SchemaField error] transform:', String(ex));
      throw ex;
    }
  }

  toObject() {
    const { name, options } = this;
    try {
      return {
        name,
        type: this.isNested
          ? '#ref'
          : `${options?.type}${options?.isArray ? '[]' : ''}`,
        ref:
          this.isNested && this.options.schema
            ? this.options.schema.path
            : undefined,
        required: options?.required,
      };
    } catch {}
  }
}

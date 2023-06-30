import { Application } from './index';
import { VmSchema } from '../vm';
import { capitalizeFirst, objectGet, objectSet } from '../common/utils';
import { Schema } from '../schema';

export class Schemas {
  schemas: Schema[] = [];

  constructor(protected app: Application, private context: IContext) {
    const files = this.app.filesByType('schema');
    files.forEach(({ fullName }) => {
      const schema = Object.create(Schema.prototype);
      const proxy = new Proxy<Schema>(schema, {});
      objectSet(context.schemas, this.toSchemaPath(fullName), proxy);
    });
    for (const { resolve, fullName } of files) {
      const schema = objectGet(context.schemas, this.toSchemaPath(fullName));
      const vm = VmSchema.create(resolve, context);
      const build = vm.build();
      this.schemas.push(build);
      Object.assign(schema, build);
    }
    this.app.emitter.emit('schemas:initiated', { schemas: this });
  }

  public setSchema(schema: Schema) {
    const existsSchema = objectGet(this.context.schemas, schema.path);
    if (existsSchema) {
      Object.assign(existsSchema, schema);
      return;
    }
    objectSet(this.context.schemas, schema.path, schema);
  }

  private toSchemaPath(s: string) {
    const arr = s.split('.');
    const last = arr.splice(-1)[0];
    return [...arr, capitalizeFirst(last)].join('.');
  }
}

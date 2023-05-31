import { VmModule } from '../module';
import { ISchemaDefine, Schema } from '../../schema';

export class VmSchema extends VmModule {
  declare exports: ISchemaDefine;
  constructor(resolve: string, context: IContext) {
    super(resolve, context);
  }

  static create(resolve: string, context: IContext) {
    return new VmSchema(resolve, context);
  }

  /**
   * Schema
   * @description Load props from `exports`
   */
  build() {
    const { Schema: schema } = this.exports;
    if (!schema) {
      throw new SyntaxError(
        `File ${this.name}.js does not contain 'Schema' field [File ${this.resolve}]`,
      );
    }
    return new Schema(this.exports, this.namespace);
  }
}

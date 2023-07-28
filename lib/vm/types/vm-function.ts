import { VmModule } from '../module';
import { ISchemaDefine } from '../../schema';
import { IProcedureMeta, Procedure } from '../procedure';

export type VmFunctionExports = {
  Function?: IProcedureMeta;
  params?: ISchemaDefine | string[] | any;
  returns?: ISchemaDefine | string[] | any;
  method: (...args) => Promise<any> | any;
  private?: boolean;
};

export class VmFunction extends VmModule {
  declare exports: VmFunctionExports;
  procedure: Procedure;

  constructor(resolve: string, context: IContext) {
    super(resolve, context);

    if (this?.exports?.method === undefined)
      throw new SyntaxError(
        `File ${this.name}.js does not contain 'method' field [File ${this.resolve}]`,
      );
    this.procedure = Procedure.createFrom(this.exports, this);
  }

  static create(resolve: string, context: IContext) {
    return new VmFunction(resolve, context);
  }

  build() {
    return this.procedure.getMethod();
  }
}

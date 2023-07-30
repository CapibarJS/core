import { VmModule } from '../module';

export type VmConfigExports = {
  private?: boolean;

  meta?: {
    name?: string;
    description?: string;
  };

  /**
   * An entity that can manage data.
   * @example PrismaClient
   */
  Entity?: any;
  crud?: {
    /**
     * Initialize only the specified methods for module
     */
    only?: string[];
    /**
     * Exclude methods declared globally for all modules at current
     */
    exclude?: string[];
  };
};

export class VmConfig extends VmModule {
  declare exports: VmConfigExports & Record<string, any>;
  constructor(resolve: string, context: IContext) {
    super(resolve, context);
  }

  static create(resolve: string, context: IContext) {
    return new VmConfig(resolve, context);
  }

  static createEmpty(): VmConfig {
    return Object.create(VmConfig.prototype);
  }
}

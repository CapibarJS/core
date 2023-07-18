import { basename, join, resolve } from 'node:path';
import * as fs from 'node:fs';
import { VmType } from '../vm';

type IAppFile = {
  type: VmType;
  namespace?: string;
  name: string;
  fullName: string;
  resolve: string;
};

export const STRUCTURE_TYPES = ['api', 'schemas', 'plugins', 'config'] as const;

const TypeToVmType = (type: IStructureType | string) => {
  const types: Record<IStructureType, VmType> = {
    config: 'config',
    plugins: 'plugin',
    api: 'function',
    schemas: 'schema',
  };
  return types[type];
};

export class Loader {
  #files: IAppFile[];

  constructor(protected root: string) {
    this.loadStructure();
  }

  load(path: string) {
    return path.startsWith('./')
      ? require(resolve(join(this.root, path)))
      : require(path);
  }

  filesByType(...types: VmType[]) {
    return this.#files.filter((x) => [...types].includes(x.type));
  }

  protected loadStructure() {
    const files = this.readFiles(this.root);
    const getFullName = (name: string, namespace?: string) =>
      namespace ? [namespace, name].join('.') : name;
    this.#files = files
      .map((filePath: string) => {
        // eslint-disable-next-line prefer-const
        let [type, ..._path] = filePath.split('/').slice(1);
        if (!_path.length || type === 'common') {
          const file = type;
          if (!type.endsWith('.js')) return;
          const name = basename(file, '.js');
          return {
            type: TypeToVmType('common'),
            name,
            fullName: name,
            resolve: filePath,
          } as IAppFile;
        }
        const [file, ...path] = _path.reverse();
        path.reverse();
        if (!file.endsWith('.js')) return;
        const name = basename(file, '.js');

        let namespace = path.join('.');
        const substrIdx = path.findIndex((x) =>
          STRUCTURE_TYPES.includes(x as any),
        );
        if (substrIdx >= 0) {
          namespace = path.splice(0, substrIdx).join('.');
          type = path.shift();
        }
        namespace = namespace.length ? namespace : undefined;
        return {
          type: TypeToVmType(name === 'index' ? 'config' : type),
          namespace,
          name,
          fullName: getFullName(name, namespace),
          resolve: filePath,
        } as IAppFile;
      })
      .filter((x) => x);
  }

  protected readFiles(path: string) {
    let files = [];
    const items = fs.readdirSync(path, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        files = [...files, ...this.readFiles(`${path}/${item.name}`)];
      } else if (item.name.endsWith('.js')) {
        files.push(`${path}/${item.name}`);
      }
    }
    return files;
  }
}

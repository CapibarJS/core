const ErrorPrefix = 'Field';

export class SchemaError {
  valid: boolean;
  errors?: string[];
  namespace?: string;

  constructor(readonly path: string, namespace?: string, parent?: string) {
    this.errors = [];
    this.valid = true;
    if (namespace) {
      this.namespace = `"${namespace}"`;
      if (parent) this.namespace = `${parent}.${this.namespace}`;
    }
  }

  add(err, field?: string | null) {
    if (SchemaError.isInstance(err)) {
      this.errors.push(...err.errors);
    } else {
      const errs = SchemaError.format(err, field, this.namespace);
      if (errs) this.errors.push(...errs);
    }
    this.valid = this.errors.length === 0;
    return this;
  }
  addErrorFunc(field: string) {
    return (err, _field = field) => this.add(err, _field);
  }
  error(err: string) {
    this.errors.push(err);
    this.valid = this.errors.length === 0;
  }

  toObject() {
    return {
      Schema: this.path,
      errors: this.errors,
      valid: this.valid,
    };
  }

  toError() {
    return JSON.stringify({
      error: {
        messages: this.errors,
      },
    });
  }

  static format(err, field?: string, namespace?: string) {
    const _namespace = namespace ? `${namespace}.` : '';
    const prefix = `${ErrorPrefix} ${_namespace}"${field}" `;
    if (typeof err === 'boolean') {
      return err ? null : [`${prefix}validation error`];
    }
    if (err) {
      const unPrefixed = Array.isArray(err) ? err : [err];
      return unPrefixed.map((x) =>
        x.startsWith(ErrorPrefix) ? x : prefix + x,
      );
    }
    return null;
  }

  static isInstance(err) {
    return Array.isArray(err?.errors);
  }
}

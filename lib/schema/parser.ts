export class Parse {
  static #ReturnNotNaN = (x) => (isNaN(x) ? undefined : x);
  static Int(v, base = 10) {
    if (!/^\d+$/gm.test(v)) return undefined;
    const parsed = parseInt(v, base);
    return Parse.#ReturnNotNaN(parsed);
  }
  static Float(v) {
    if (typeof v === 'string') v.replace(',', '.');
    if (!/^\d+([,.]\d+)?$/gm.test(v)) return undefined;
    const parsed = parseFloat(v);
    return Parse.#ReturnNotNaN(parsed);
  }
  static Date(v) {
    const exp =
      /^(\d{4})-(\d{2})-(\d{2})(T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z)?$/gm;
    if (!exp.test(v)) return undefined;
    return Parse.#ReturnNotNaN(new Date(v));
  }
  static Boolean(v) {
    if (typeof v === 'boolean') return v;
    if (typeof v === 'string')
      return v === 'true' ? true : v === 'false' ? false : undefined;
    if (typeof v === 'number') return Boolean(v);
    return undefined;
  }
}

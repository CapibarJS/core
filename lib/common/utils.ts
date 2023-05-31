export const objectSet = (obj, path, value) => {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key]) current[key] = {};
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
};
export const objectGet = (obj, key) => {
  const keys = key.split('.');
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (!current[k]) return undefined;
    current = current[k];
  }
  return current;
};

export const isFirstUpper = (s: string) =>
  !!s && s.charAt(0) === s.charAt(0).toUpperCase();
export const isFirstLower = (s: string) => !isFirstUpper(s);
export const capitalizeFirst = (s: string) => {
  if (!s) return;
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export const toESType = (t: string) => {
  if (!t) return 'any';
  if (isFirstUpper(t)) return t;
  switch (t) {
    case 'date':
      return 'Date';
    case 'int':
    case 'float':
      return 'number';
  }
  return t;
};

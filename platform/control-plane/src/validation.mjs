export function validSlug(value) {
  return typeof value === 'string' &&
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(value);
}

export function validImage(value) {
  return typeof value === 'string' &&
    value.length <= 240 &&
    /^[a-z0-9][a-z0-9._/-]*(?::[A-Za-z0-9._-]+)?$/i.test(value);
}

export function validPort(value) {
  const port = Number(value);
  return Number.isInteger(port) && port >= 1 && port <= 65535;
}

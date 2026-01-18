export function getCurrentTime(): number {
  return performance.now();
}

export function isArray(sth: any) {
  return Array.isArray(sth);
}

export function isNum(sth: any) {
  return typeof sth === "number";
}

export function isStr(sth: any) {
  return typeof sth === "string";
}

export function isFn(sth: any) {
  return typeof sth === "function";
}

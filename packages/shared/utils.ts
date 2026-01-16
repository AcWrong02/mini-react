export function getCurrentTime(): number {
  return performance.now();
}

export function isNum(sth: any) {
  return typeof sth === "number";
}

export function isStr(sth: any) {
  return typeof sth === "string";
}

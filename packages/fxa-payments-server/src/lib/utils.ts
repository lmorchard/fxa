// https://stackoverflow.com/questions/38598280/is-it-possible-to-wrap-a-function-and-retain-its-types
export const wrapFn = <T extends Array<any>, U>(
  wrapperFn: Function,
  fn: (...args: T) => U
) => {
  return (...args: T): U => wrapperFn(fn(...args));
};

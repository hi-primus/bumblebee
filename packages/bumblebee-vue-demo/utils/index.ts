export const throttle = (
  func: (...args: unknown[]) => unknown,
  limit: number | ((...args: Arguments<typeof func>) => number)
): typeof func => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias */
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: any;
  return function (...args: unknown[]) {
    const context = this;
    limit = typeof limit === 'function' ? limit.apply(context, args) : limit;

    if (!lastRan) {
      func.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}
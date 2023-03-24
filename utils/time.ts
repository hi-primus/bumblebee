export const throttle = <T extends Array<unknown>>(
  func: (...args: T) => unknown,
  limit: number | ((...args: Arguments<typeof func>) => number)
): typeof func => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias */
  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: any;
  return function (...args: T) {
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
};

export const throttleOnce = (
  func: (...args: unknown[]) => Promise<unknown>,
  options: {
    limit?: number | ((...args: Arguments<typeof func>) => number);
    delay?: number | ((...args: Arguments<typeof func>) => number);
    cancellable?: boolean | ((...args: Arguments<typeof func>) => boolean);
  } = {}
) => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias */
  const defaultLimit = options.limit === undefined ? 1000 : options.limit;
  const defaultDelay = options.delay === undefined ? 0 : options.delay;
  const defaultCancelable =
    options.cancellable === undefined ? false : options.cancellable;

  let lastFunc: ReturnType<typeof setTimeout>;
  let lastRan: any;

  let promise: Promise<unknown> | null = null;
  let cancel: ((reason?: any) => Promise<void>) | null = null;

  const throttledFunc = async function (...args: unknown[]) {
    const context = this;

    const limit =
      typeof defaultLimit === 'function'
        ? defaultLimit.apply(context, args)
        : (defaultLimit as number);

    const delay =
      typeof defaultDelay === 'function'
        ? defaultDelay.apply(context, args)
        : (defaultDelay as number);

    const cancellable =
      typeof defaultCancelable === 'function'
        ? defaultCancelable.apply(context, args)
        : (defaultCancelable as boolean);

    if (promise) {
      if (cancellable) {
        if (cancel) {
          await cancel();
          cancel = null;
        }
        // awaits for previous promise and creates a new one
        await promise;
        promise = null;
      } else {
        // awaits for previous promise and returns it
        await promise;
        promise = null;
        return;
      }
    }

    if (!lastRan) {
      lastRan = Date.now() - limit;
    }

    clearTimeout(lastFunc);
    promise = new Promise((resolve, reject) => {
      cancel = async () => {
        resolve(new Error('Cancelled'));
        await promise;
      };
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          setTimeout(function () {
            func
              .apply(context, args)
              .then(result => {
                resolve(result);
              })
              .catch(error => {
                reject(error);
              });
          }, delay);
        }
      }, limit - (Date.now() - lastRan));
    });
    try {
      const result = await promise;
      promise = null;
      lastRan = Date.now();
      return result;
    } catch (error) {
      promise = null;
      lastRan = Date.now();
      throw error;
    }
  };

  throttledFunc.cancel = async () => {
    if (cancel) {
      await cancel();
    }
    cancel = null;
    promise = null;
  };

  return throttledFunc;
};

export const debounce = <T>(
  func: T,
  delay: number | ((...args: Arguments<typeof func>) => number)
): T => {
  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-this-alias */
  let inDebounce: ReturnType<typeof setTimeout>;
  if (typeof func !== 'function') {
    throw new TypeError('Expected a function');
  }
  return function (...args: Arguments<T>) {
    const context = this;
    delay = typeof delay === 'function' ? delay.apply(context, args) : delay;
    clearTimeout(inDebounce);
    inDebounce = setTimeout(() => func.apply(context, args), delay);
  } as T;
};

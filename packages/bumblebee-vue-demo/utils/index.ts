export function throttle(func, limit: number | Function): typeof func {
  var lastFunc: ReturnType<typeof setTimeout>;
  var lastRan: any;
  return function () {
    var context = this as any;
    var args = arguments;
    limit =
      typeof limit === 'function'
        ? (limit.apply(context, args) as number)
        : limit;

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

export const navigatorDetection = () => {
  let browserValue = null;

  if (process.server) {
    return browserValue;
  }

  const userAgent = navigator.userAgent;
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserValue = "chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserValue = "firefox";
  } else if (userAgent.match(/safari/i)) {
    browserValue = "safari";
  } else if (userAgent.match(/opr\//i)) {
    browserValue = "opera";
  } else if (userAgent.match(/edg/i)) {
    browserValue = "edge";
  }

  return browserValue;
};

export const inputAutoNone = () => {
  const navigator = navigatorDetection();
  let autocomplete = "off";
  if (navigator && ["firefox", "safari", "opera", "edge"].includes(navigator)) {
    autocomplete = "off";
  }

  return autocomplete;
};
export function throttle(func, limit: number | Function): typeof func {
  var lastFunc: ReturnType<typeof setTimeout>
  var lastRan: any
  return function () {
    var context = this as any
    var args = arguments
    limit =
      typeof limit === 'function'
        ? (limit.apply(context, args) as number)
        : limit

    if (!lastRan) {
      func.apply(context, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(function () {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

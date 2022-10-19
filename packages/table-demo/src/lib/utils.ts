
export function loadScript (url: string){
  return new Promise((resolve, reject) => {
    try {
      let scriptTag = document.createElement('script');
      scriptTag.src = url;
    
      scriptTag.onload = resolve;
    
      document.body.appendChild(scriptTag);
    } catch (err) {
      reject(err)
    }
  })
};

export function throttle(func: Function, limit: number | Function): Function {
  var lastFunc: ReturnType<typeof setTimeout>;
  var lastRan: any;
  return function () {
    var context = this as any;
    var args = arguments;
    limit = typeof limit === 'function' ? limit.apply(context, args) as number : limit;

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

const optimizeRange = (inputRange: number[], existingRange: number[]): number[][] => {
  let resultRanges = [];

  if (existingRange && !(existingRange[1] < inputRange[0] || existingRange[0] > inputRange[1])) {  
    if (inputRange[0]<existingRange[0]) {
      resultRanges.push([inputRange[0], existingRange[0]]);
    }
    if (inputRange[1]>existingRange[1]) {
      resultRanges.push([existingRange[1], inputRange[1]]);
    }
  }
  else {
    resultRanges.push(inputRange);
  }
  return resultRanges;
}

export const optimizeRanges = (inputRange: number[], existingRanges: number[][]): number[][] => {
  let resultRanges: number[][] = [inputRange];

  existingRanges.forEach(existingRange => {
    let resultRangesResults: number[][][] = resultRanges.map(range => optimizeRange(range, existingRange));
    resultRanges = resultRangesResults.flat(1);
  });

  return resultRanges;

}
export const throttle = (func, limit) => {
	let lastFunc
	let lastRan
	return function () {
		const context = this
		const args = arguments
		if (!lastRan) {
			func.apply(context, args)
			lastRan = Date.now()
		} else {
			clearTimeout(lastFunc)
			lastFunc = setTimeout(function () {
				if ((Date.now() - lastRan) >= limit) {
					func.apply(context, args)
					lastRan = Date.now()
				}
			}, limit - (Date.now() - lastRan))
		}
	}
}

export const arrayJoin = (array,separator = ', ',final_separator = ' and ') => {
  var outStr = "";
  if (array.length === 1) {
    outStr = array[0];
  } else if (array.length === 2) {
    outStr = array.join(final_separator);
  } else if (array.length > 2) {
    outStr = array.slice(0, -1).join(separator) + final_separator + array.slice(-1);
  }
  return outStr;
}

export const trimCharacters = (s, c) => {
  if (c === "]") c = "\\]";
  if (c === "\\") c = "\\\\";
  return s.replace(new RegExp(
    "^[" + c + "]+|[" + c + "]+$", "g"
  ), "");
}

export const newName = (name) => {
	name = name.toString()
  let matches = name.match(/\d+$/);
  if (matches) {
    let number = matches[0]
    let prefix = name.substr(0,matches.index)
    return prefix + (+number+1)
  }
  else {
    return name+'2'
  }
}

export const debounce = (func, delay) => {
  let inDebounce
  return function() {
    const context = this
    const args = arguments
    clearTimeout(inDebounce)
    inDebounce = setTimeout(() => func.apply(context, args), delay)
  }
}

export const stepify = (a, b, f = Math.round) => {
  return f(a / b) * b;
}


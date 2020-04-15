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

export const arraysEqual = (_arr1, _arr2) => {

  if (!Array.isArray(_arr1) || !Array.isArray(_arr2) || _arr1.length !== _arr2.length)
    return false;

  var arr1 = _arr1.concat();
  var arr2 = _arr2.concat();

  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i])
      return false;
  }
  return true;
}

export const cancellablePromise = (promiseToCancel) => {
  let cancel
  const promise = new Promise((resolve, reject) => {
    cancel = reject
    promiseToCancel
      .then(resolve)
      .catch(reject)
  })
  return {promise, cancel}
}

export const trimCharacters = (s, c) => {
  if (c === "]") c = "\\]";
  if (c === "\\") c = "\\\\";
  return s.replace(new RegExp(
    "^[" + c + "]+|[" + c + "]+$", "g"
  ), "");
}

export const getSelectedText = () => {
  var text = ""
  var selection
  if (typeof window.getSelection != "undefined") {
    selection = window.getSelection()
    try {
      text = selection.toString()
    } catch (error) {
      text = selection.baseNode.data
    }
  } else if (typeof document.selection != "undefined" && document.selection.type == "Text") {
    selection = document.selection.createRange()
    text = selection.text
  }
  return {selection, selectedText: text}
}

export const parseResponse = (content) => {
  // console.log('[DEBUG] parsedContent',content)
  try {
    if (typeof content !== 'string') {
      return content
    }
    content = trimCharacters(content,"'")
    content = content.replace(/\bNaN\b/g,null)
    content = content.replace(/\b\\'\b/g,"'")
    return JSON.parse(content)
  } catch (error) {
    return false
  }
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

export const reduceRanges = (ranges_array) => {
  return ranges_array.reduce( (ranges, range) => {
    if (ranges.length==0) {
      return [range]
    }
    else {
      var last = ranges[ranges.length-1][1]
      if (last==range[0]) {
        ranges[ranges.length-1][1] = range[1]
        return ranges
      }
      else {
        return [...ranges, range]
      }
    }
  }, [])
}

export const copyToClipboard = (str) => {
  const el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

export const optimizeRanges = (inputRange, existingRanges) => {
  var newRanges = [inputRange]

  for (let i = 0; i < newRanges.length; i++) {
    existingRanges.forEach(range => {
      if (newRanges[i][0]<=range[0] && newRanges[i][1]>=range[1]) {
        var pushChunk = [range[1]+1, newRanges[i][1]]
        newRanges[i] = [newRanges[i][0], range[0]-1,]
        newRanges.push(pushChunk)
      }
    })
  }
  for (let i = 0; i < newRanges.length; i++) {
    existingRanges.forEach(range => {
      if (newRanges[i][0]<=range[1] && newRanges[i][0]>=range[0]) {
        newRanges[i][0] = range[1] + 1
      }
    });
    existingRanges.reverse().forEach(range => {
      if (newRanges[i][1]>=range[0] && newRanges[i][1]<=range[1]) {
        newRanges[i][1] = range[0] - 1
      }
    })
  }
  for (let i = newRanges.length - 1; i >= 0 ; i--) {
		if (newRanges[i][0]>newRanges[i][1]) {
			newRanges.splice(i, 1)
		}
	}
  return newRanges
}

export const escapeQuotes = (str) => {
  if (typeof str === 'string' && str && str.replace ) {
    return str.replace(/[\""]/g, '\\"')
  } else if (str && str.map) {
    str = str.map(_str=>(_str && _str.replace) ? _str.replace(/[\""]/g, '\\"') : _str)
  }
  return str
}

export const getOutputColsArgument = (output_cols = [], input_cols = [], pre = '') => {
  if (output_cols.join('').trim().length) {
    return (output_cols.length===1)
    ? `"${output_cols[0]}"`
    : `[${output_cols.map((e, i)=>(e ? `"${escapeQuotes(e)}"` : (input_cols[i] ? `"${escapeQuotes(pre+input_cols[i])}"` : 'None'))).join(', ')}]`
  }
  if (input_cols.join('').trim().length) {
    return (input_cols.length===1)
      ? `"${pre}${input_cols[0]}"`
      : `[${input_cols.map((e)=>(e ? `"${escapeQuotes(pre+e)}"` : 'None')).join(', ')}]`
  }
  return false
}

export const escapeQuotesOn = (payload = {}, keys = []) => {
  var _payload = {}
  keys.forEach(key => {
    _payload[key] = escapeQuotes(payload[key])
  });
  return {...payload, ..._payload}
}

export const printError = (response) => {
  // if (response.content && response.content.traceback && response.content.traceback.length) {
  //   response.content.traceback_escaped = response.content.traceback.map(l=>
  //     l.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
  //   )
  //   console.error(response.content.traceback_escaped.join('\n'))
  // }
  if (response.traceback) {
    console.error('[DEBUG][ERROR]\n\n',response.traceback)
  } else if (response.message) {
    console.error('[DEBUG][ERROR]\n',response.message)
  } else {
    console.error(response)
  }
}

export const getProperty = (pof, args = []) => {
  if (typeof pof === 'function') {
    return pof(...args)
  } else {
    return pof
  }
}
export const getPropertyAsync = async (pof, args = []) => {
  if (typeof pof === 'function') {
    return await pof(...args)
  } else {
    return pof
  }
}

export const namesToIndices = (cols = [], datasetColumns = []) => {
  try {
    return cols.map(name=>datasetColumns.findIndex(column => column.name===name))
  } catch (error) {
    return cols
  }
}

export const indicesToNames = (cols = [], datasetColumns = []) => {
  try {
    return cols.map(i=>datasetColumns[i].name)
  } catch (error) {
    return cols
  }
}

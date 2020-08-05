import "core-js/stable"
import "regenerator-runtime/runtime"

export const deepCopy = (inObject) => {
  let outObject, value, key

  if (typeof inObject !== "object" || inObject === null) {
    return inObject // Return the value if inObject is not an object
  }

  // Create an array or object to hold the values
  outObject = Array.isArray(inObject) ? [] : {}

  for (key in inObject) {
    value = inObject[key]

    // Recursively (deep) copy for nested objects, including arrays
    outObject[key] = deepCopy(value)
  }

  return outObject
}

export const transpose = (a) => {
  return Object.keys(a[0]).map(function(c) {
    return a.map(function(r) { return r[c]; });
  });
}

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
			lastFunc = setTimeout(() => {
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

export const asyncDebounce = (func, delay) => {
  let inDebounce
  return function () {
    const context = this
    const args = arguments
    return new Promise((resolve, reject)=>{
      clearTimeout(inDebounce)
      inDebounce = setTimeout(async () => {
        try {
          var result = await func.apply(context, args)
          resolve(result)
        } catch (err) {
          reject(err)
        }
      }, delay)
    })
  }
}

export const debounce = (func, delay) => {
  let inDebounce
  return function () {
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
    return str.replace(/[\\]/g, '\\\\').replace(/[\""]/g, '\\"')
  } else if (str && str.map) {
    str = str.map(_str=>(_str && _str.replace) ? _str.replace(/[\\]/g, '\\\\').replace(/[\""]/g, '\\"') : _str)
  }
  return str
}

export const getOutputColsArgument = (output_cols = [], input_cols = [], pre = '', forceArray = false) => {
  var hasInput = input_cols.join('').trim().length
  if (output_cols.join('').trim().length && !(hasInput && pre)) {
    return (output_cols.length===1 && !forceArray)
    ? `"${output_cols[0]}"`
    : `[${output_cols.map((e, i)=>(e ? `"${escapeQuotes(e)}"` : (input_cols[i] ? `"${escapeQuotes(pre+input_cols[i])}"` : 'None'))).join(', ')}]`
  }
  if (hasInput) {
    return (input_cols.length===1 && !forceArray)
      ? `"${pre}${input_cols[0]}"`
      : `[${input_cols.map((e)=>(e ? `"${escapeQuotes(pre+e)}"` : 'None')).join(', ')}]`
  }
  return false
}

export const columnsHint = (columns = [], output_cols = []) => {
  if (output_cols.join('').length) {
    var output_cols_argument = getOutputColsArgument(output_cols, columns, '')
    return multipleContent([columns, output_cols_argument], 'hl--cols', ', ', ' to ', false, false)
  } else {
    return multipleContent([columns], 'hl--cols', ', ', ' to ', false, false)
  }
}

export const escapeQuotesOn = (payload = {}, keys = []) => {
  var _payload = {}
  keys.forEach(key => {
    _payload[key] = escapeQuotes(payload[key])
  });
  return {...payload, ..._payload}
}

export const printError = (payload) => {

  var data = payload.data || payload
  var content = data.errorValue || data.content

  if (data.traceback && data.traceback.length) {
    console.error('[DEBUG][ERROR][TRACEBACK]\n',data.traceback.join('\n'))
  }
  else if (content && data.error) {
    console.error('[DEBUG][ERROR]\n',data.error+'\n',content)
  }
  else if (data.error) {
    console.error('[DEBUG][ERROR]\n',data.error)
  }
  if (!(data.error || data.traceback)) {
    console.error('[DEBUG][ERROR] (response)\n',payload)
  }

  if (payload.code) {
    console.error('[DEBUG][ERROR][CODE]',payload.code)
  }

  return ((data.traceback && data.traceback[data.traceback.length-1]) || data.error || data.message || data).toString().split('\n')[0]
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

export const capitalizeString = (str) => {
  try {
    return str.charAt(0).toUpperCase()+str.slice(1)
  } catch (error) {
    return str
  }
}

export const decapitalizeString = (str) => {
  try {
    return str.charAt(0).toLowerCase()+str.slice(1)
  } catch (error) {
    return str
  }
}


export const spanClass = (text, cls) => {
  if (!cls) {
    return text
  }
  return `<span class="${cls}">${text}</span>`
}

export const hlParam = (text) => {
  return spanClass(`'${text}'`,'hl--param')
}

export const hlCols = (text) => {
  return spanClass(`'${text}'`,'hl--cols')
}

export const multipleContent = (arrays, colors, arraySep = ', ', pairSep = ', ', brackets = true, parentheses = true) => {

  arrays = arrays.map(array=>{
    if (!array || !array.join || !array.map)
      return [array]
    return array
  })

  if (!colors.join || !colors.map) {
    colors = [colors]
  }

  var array = arrays[0]
  var str = ''

  if (arrays.length===1) {
    if (array.length==1) {
      // 'a'
      brackets = false
      str = spanClass(`'${array[0]}'`,colors[0])
    } else {
      // ['a', 'aa']
      str = array.map(e=>spanClass(`'${e}'`,colors[0])).join(arraySep)
    }
  } else {
    array = arrays[0].map((e,i)=>{
      return arrays.map((arr, j)=>{
        return spanClass(`'${arr[i]}'`,colors[j] || colors[0])
      }).join(pairSep)
    })
    if (array.length==1) {
      // 'a', 'b'
      brackets = false
      str = `${array[0]}`
    } else {
      // [('a', 'b'), ('aa', 'bb')]
      if (parentheses) {
        arraySep = ")"+arraySep+"("
      }
      str = array.join(arraySep)
      if (parentheses) {
        str = `(${str})`
      }
    }
  }
  if (brackets) {
    return `[${str}]`
  }
  return str

}

export const everyRatio = (array,cb) => {
  if (array.length===0) {
    return 1
  }
  var count = 0
  for (let i = 0; i < array.length; i++) {
    count += cb(array[i],i) ? 1 : 0
  }
  return count/array.length
}

export const propsToLocal = (array) => {
  var oobj = array.reduce((obj, item)=>{
    var localName = 'local'+capitalizeString(item)
    obj[localName] = {
      set (value) {
        this.$emit(`update:${item}`, value)
      },
      get () {
        return this[item]
      }
    }
    return obj
  },{})
  return oobj
}

// constants

export const TYPES = {
  INT: "int",
  DECIMAL: "decimal",
  STRING: "string",
  BOOLEAN: "boolean",
  DATE: "date",
  ARRAY: "array",
  OBJECT: "object",
  GENDER: "gender",
  IP: "ip",
  URL: "url",
  EMAIL: "email",
  CREDIT_CARD_NUMBER: "credit_card_number",
  ZIP_CODE: "zip_code",
  MISSING: "missing",
  CATEGORICAL: "categorical",
  TIME: "time"
}

export const TYPES_HINTS = {
  "int": "#",
  "decimal": "#.##",
  "string": "ABC",
  "boolean": "0/1",
  "date": "📅",
  "array": "[ ]",
  "object": "obj",
  "gender": "gen",
  "ip": "ip",
  "url": "url",
  "email": "a@b",
  "credit_card_number": "####",
  "zip_code": "zip",
  "missing": "mis",
  "categorical": "cat",
  "time": "time"
}

export const TYPES_NAMES = {
  "int": "Integer",
  "decimal": "Decimal",
  "string": "String",
  "boolean": "Boolean",
  "date": "Date",
  "array": "Array",
  "object": "Object",
  "gender": "Gender",
  "ip": "IP Address",
  "url": "URL",
  "email": "Email",
  "credit_card_number": "Credit Card Number",
  "zip_code": "Zip Code",
  "missing": "Missing",
  "categorical": "Categorical",
  "time": "Time"
}

export const ALL_TYPES = Object.values(TYPES)

export const STRING_TYPES = [
  TYPES.STRING,
  TYPES.OBJECT,
  TYPES.CATEGORICAL,
  TYPES.DATE,
  TYPES.TIME
]

export const RESPONSE_MESSAGES = {
  'user': {
    201: 'User account successfully created',
    404: 'User not found',
    500: 'Something went wrong'
  },
  'default': {
    404: 'Server not found',
    500: 'Something went wrong'
  }
}

export default {
  deepCopy,
  transpose,
  throttle,
  arrayJoin,
  arraysEqual,
  cancellablePromise,
  trimCharacters,
  getSelectedText,
  parseResponse,
  newName,
  asyncDebounce,
  debounce,
  stepify,
  reduceRanges,
  copyToClipboard,
  optimizeRanges,
  escapeQuotes,
  getOutputColsArgument,
  columnsHint,
  escapeQuotesOn,
  printError,
  getProperty,
  getPropertyAsync,
  namesToIndices,
  indicesToNames,
  capitalizeString,
  decapitalizeString,
  spanClass,
  hlParam,
  hlCols,
  multipleContent,
  everyRatio,
  propsToLocal,
  TYPES,
  TYPES_HINTS,
  TYPES_NAMES,
  ALL_TYPES,
  STRING_TYPES,
  RESPONSE_MESSAGES
}

// exports.meta = require('./package.json')

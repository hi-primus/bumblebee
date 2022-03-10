import "core-js/stable"
import "regenerator-runtime/runtime"

// export class
export class ErrorWithResponse extends Error {
  constructor(message, response = {}) {
    super(message)
    this.response = response
  }
}

export const deepCopy = (inObject, deep = undefined) => {
  let outObject, value, key

  if (typeof inObject !== "object" || inObject === null || (deep!==undefined && deep<=0)) {
    return inObject // Return the value if inObject is not an object
  }

  // Create an array or object to hold the values
  outObject = Array.isArray(inObject) ? [] : {}

  for (key in inObject) {
    value = inObject[key]

    // Recursively (deep) copy for nested objects, including arrays
    outObject[key] = deepCopy(value, deep!==undefined ? deep-1 : undefined)
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
    limit = typeof limit === 'function' ? limit.apply(context, args) : limit
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
  // console.debug('[DEBUG] parsedContent',content)
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
    let prefix = name.substring(0,matches.index)
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
    delay = typeof delay === 'function' ? delay.apply(context, args) : delay
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
    delay = typeof delay === 'function' ? delay.apply(context, args) : delay
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

export const copyToClipboard = (str, target) => {
  const el = document.createElement('textarea');
  el.value = str;
  target = target || document.body;
  target.appendChild(el);
  el.select();
  document.execCommand('copy');
  target.removeChild(el);
};

const optimizeRange = (inputRange, existingRange) => {
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

export const optimizeRanges = (inputRange, existingRanges) => {

  let resultRanges = [inputRange];

  existingRanges.forEach(existingRange => {
    let resultRangesResults = resultRanges.map(range => optimizeRange(range, existingRange));
    resultRanges = [].concat.apply([], resultRangesResults);
  });

  return resultRanges;

}

export const getColumnsRange = function(group, root = 0, size = 10, rootSize = 10) {
  let sign = group%2 ? 1 : -1;
  let d = Math.round(group/2)
  let s = sign < 0 ? (d*size) : ((d-1)*size + rootSize);
  let a = root + s*sign
  let b = a + (group ? size : rootSize);
  if (a<=0 && b<=0) {
    return [-1, -1]
  } else if (a<0 && b>=0) {
    a = 0;
  } 
  return [a, b]
}


export const escapeQuotes = (str) => {
  if (typeof str === 'string' && str && str.replace ) {
    str = str.replace(/[\\]/g, '\\\\').replace(/[\""]/g, '\\"');
  } else if (str && str.map) {
    str = str.map(_str=>(_str && _str.replace) ? _str.replace(/[\\]/g, '\\\\').replace(/[\""]/g, '\\"') : _str);
  }
  return str;
}

export const adaptValue = (v) => {
  if (!isNaN(v) && !isNaN(parseFloat(v))) {
    return v;
  }
  if (v.toUpperCase == "TRUE") {
    return 'True'
  }
  if (v.toUpperCase == "FALSE") {
    return 'False'
  }
  return `"${escapeQuotes(trimCharacters(v, '"'))}"`
}

export const filterCells = (cells, newOnly, ignoreFrom) => {
  if (newOnly) {
    return cells.filter((e,i)=>((ignoreFrom<0 || i<ignoreFrom) && e.code!=='' && !e.done && !e.ignore));
  } else {
    return cells.filter((e,i)=>((ignoreFrom<0 || i<ignoreFrom) && e.code!=='' && !e.ignore));
  }
}

export const getOutputColsArgument = (output_cols = [], input_cols = [], pre = '', forceArray = false) => {

  if (input_cols === false || output_cols === false) {
    return false;
  }

  var hasInput = input_cols.join('').trim().length;
  let output = false;

  if (output_cols.join('').trim().length && !(hasInput && pre)) {
    if (output_cols.length===1 && !forceArray) {
      output = `"${escapeQuotes(output_cols[0])}"`
    } else {
      output = `[${output_cols.map((e, i)=>(e ? `"${escapeQuotes(e)}"` : (input_cols[i] ? `"${escapeQuotes(pre+input_cols[i])}"` : 'None'))).join(', ')}]`
    }
  } else if (hasInput) {
    if (input_cols.length===1 && !forceArray) {
      output = `"${escapeQuotes(pre+input_cols[0])}"`
    } else {
      output = `[${input_cols.map((e)=>(e ? `"${escapeQuotes(pre+e)}"` : 'None')).join(', ')}]`
    }
  }
  return output;
}

export const aggOutputCols = (payload) => {
  return payload.aggregations.map((aggregation,i)=>`${aggregation}_${payload.input_cols[i]}`)
}

export const preparedColumns = function(columns, array=false, escape=true) {
  if (escape) {
    columns = escapeQuotes(columns);
  }
  if (Array.isArray(columns) && columns.length) {
    return `["${columns.join('", "')}"]`;
  } else if (typeof columns === 'string') {
    if (array) {
      return `["${columns}"]`;
    } else {
      return `"${columns}"`;
    }
  } else {
    return '"*"';
  }
}

export const columnsHint = (columns = [], output_cols = []) => {
  if (output_cols.join('').length) {
    var output_cols_argument = getOutputColsArgument(output_cols, columns, '')
    return multipleContent([columns, output_cols_argument], 'hl--cols', ', ', ' to ', false, false)
  } else {
    return multipleContent([columns], 'hl--cols', ', ', ' to ', false, false)
  }
}

export const formFromParam = (key, param) => {

  if (param.hidden) {
    return false;
  }

  if (param.type == "columns") {
    return {
      type: "autocomplete",
      key,
      label: param.label || key,
      clearable: true,
      items_key: "allColumns",
    };
  }

  if (param.type == "connection") {
    return {
      type: "connection",
      key,
      label: param.label || key,
      include: param.include
    };
  }

  if (param.items) {
    let items = param.items;
    if (Array.isArray(items)) {
      items = items.map(item => ({value: item, text: item}));
    } else if (items && typeof items === 'object') {
      items = Object.entries(items).map(([value, text]) => ({value, text}));
    }
    return {
      label: param.label || key,
      key,
      type: "select",
      items
    };
  }

  if (["int", "string", "const"].includes(param.type)) {
    return {
      label: param.label || key,
      key,
      type: param.type == "int" ? "number" : "field"
    };
  }

  if (param.type && param.type.includes("array")) {
    return {
      label: param.label || key,
      key,
      type: "chips"
    };
  }

  if (param.type == "boolean") {
    return {
      label: (c) => (param.label || key) + ": " + (c[key] ? "Yes" : "No"),
      key,
      type: "switch"
    };
  }

  return {
    label: param.label || key,
    key,
    type: "field",
    mono: true
  };

}

export const escapeQuotesOn = (payload = {}, keys = []) => {
  var _payload = {}
  keys.forEach(key => {
    _payload[key] = escapeQuotes(payload[key])
  });
  return {...payload, ..._payload}
}

export const handleResponse = (response) => {
  let parsedResponse;
	try {
		if (
			typeof response === 'object' &&
			!response['text/plain'] &&
			response['status']
		) {
			parsedResponse = response;
		} else {
      if (typeof response === 'object' && response['text/plain']) {
        response = response['text/plain'];
      }

      if (typeof response !== 'string') {
        throw response;
      }

      const bracketIndex = response.indexOf('{');

      if (bracketIndex < 0) {
        throw { message: 'Invalid response format', response };
      }

      response = response.substring(bracketIndex);
      response = trimCharacters(response, "'");
      response = response.replace(/\bNaN\b/g, null);
      response = response.replace(/\\+\'/g, "'");
      response = response.replace(/\\\\"/g, '\\"');
      response = response.replace(/\\\\u([\d\w]{4})/gi, (match, grp) => String.fromCharCode(parseInt(grp, 16)));
      response = response.replace(/[\x00-\x1F]|[\x80-\x9F]/g, '');
      parsedResponse = JSON.parse(response);
    }
	} catch (err) {

    try {
      parsedResponse = JSON.parse(response);
      console.error('Response handling error', err);
      parsedResponse = {
        ...parsedResponse,
        error: err.toString(),
        status: 'error'
      };
    } catch (err2) {
      console.error('Response parsing error', err2);
      parsedResponse = {
        raw: response,
        error: err2.toString(),
        status: 'error'
      };
    }

	}

  const replace_traceback = (l) => l.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    '',
  );

  if (parsedResponse && parsedResponse.traceback && parsedResponse.traceback.map) {
		parsedResponse.traceback = parsedResponse.traceback.map(replace_traceback);
	}

  return parsedResponse;
};

export const printError = (payload) => {

  var data = payload.data || payload
  var content = data.content

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

  let traceback = data.traceback && data.traceback[data.traceback.length-1];

  if (traceback) {
    traceback = traceback.split('\n');
    traceback = traceback[traceback.length - 1];
  }

  return (traceback || data.error || data.message || data).toString().split('\n')[0];

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
    return cols.map(name=>datasetColumns.findIndex(column => column.name===name)).filter(index=>index>=0);
  } catch (error) {
    return cols;
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

export const nameify = (str) => {
  return capitalizeString(str).replace(/_/g,' ')
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

export const multipleContent = (arrays, colors, arraySep = null, pairSep = ', ', brackets = true, parentheses = true) => {

  arrays = arrays.map(array=>{
    if (!array || !array.join || !array.map)
      return [array]
    return array
  })

  if (!colors.join || !colors.map) {
    colors = [colors]
  }

  let array = arrays[0]
  let str = ''

  let joinArray;

  if (typeof arraySep == 'string') {
    joinArray = (a) => a.join(arraySep)
  } else if (typeof arraySep == 'function') {
    joinArray = arraySep
  } else {
    joinArray = arrayJoin
  }
  
  let joinPair;

  if (typeof pairSep == 'string') {
    joinPair = (a) => a.join(pairSep)
  } else if (typeof pairSep == 'function') {
    joinPair = pairSep
  } else {
    joinPair = arrayJoin
  }

  if (arrays.length===1) {
    if (array.length==1) {
      // 'a'
      brackets = false
      str = spanClass(`'${array[0]}'`,colors[0])
    } else {
      // ['a', 'aa']
      str = joinPair(array.map(e=>spanClass(`'${e}'`,colors[0])))
    }
  } else {
    array = arrays[0].map((e,i)=>{
      return joinPair(arrays.map((arr, j)=>{
        return joinArray([arr[i]].flat(1).map(e=>spanClass(`'${e}'`,colors[j] || colors[0])))
      }))
    })
    if (array.length==1) {
      // 'a', 'b'
      brackets = false
      str = `${array[0]}`
    } else {
      // [('a', 'b'), ('aa', 'bb')]
      if (parentheses) {
        str = joinArray(array.map(e => `(${e})`))
      } else {
        str = joinArray(array)
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

export const objectFilter = (obj, cb) => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key,value])=>cb([key,value])
    )
  )
}

export const objectMap = (obj, cb) => {
  return Object.fromEntries(
    Object.entries(obj).map(
      ([key,value])=>[key, cb(value)]
    )
  )
}

export const objectMapEntries = (obj, cb) => {
  return Object.fromEntries(
    Object.entries(obj).map(
      ([key,value])=>[key, cb(key,value)]
    )
  )
}

export const objectMapFromEntries = (obj, cb) => {
  return Object.fromEntries(
    Object.entries(obj).map(
      ([key,value])=>cb(key,value)
    )
  )
}

export const getCodePayload = (payload) => {
  if (payload._generator && typeof payload._custom === 'function' ) {
    return payload._custom(payload);
  } else {
    return payload;
  }
}

export const transformDateToPython = (string) => {
  if (string && string.replace)
    return string.replace(/a|A|w|d|b|B|m|y|Y|H|I|p|M|S|f|z|Z|j|U|W|c|x|X|%/g,(match)=>`%${match}`)
  return ''
}

export const transformDateFromPython = (string) => {
  if (string && string.replace)
    return string.replace(/%(a|A|w|d|b|B|m|y|Y|H|I|p|M|S|f|z|Z|j|U|W|c|x|X|%)/g,(match)=>`${match.substring(1)}`)
  return ''
}

const tagsToReplace = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};

const replaceTag = (tag) => {
  return tagsToReplace[tag] || tag;
}

export const replaceTags = (string) => {
  if (string && string.replace) {
    return string.replace(/[&<>]/g, replaceTag);
  }
  return string;
}

export const engineValid = (key, engine) => {
  return !INIT_PARAMS[key] || (!INIT_PARAMS[key].engines || INIT_PARAMS[key].engines.includes(engine))
};

export const getDefaultParams = (_params) => {

  var params = {};

  Object.entries(INIT_PARAMS).forEach(([key, param])=>{
    if (engineValid(key, _params.engine)) {
      if (param.default !== undefined && _params[key] === undefined) {
        params[key] = getProperty(param.default, [params]);
      } else if (_params[key] !== undefined) {
        params[key] = _params[key];
      }
    }
  });

  return params;
}

export const getEngines = (remove = []) => {
  return objectFilter(ENGINES, ([key, value])=>{
    return !remove.includes(key);
  });
}

export const getInitParams = (engine) => {
  return objectFilter(INIT_PARAMS, ([key, param])=>{
    return engineValid(key, engine);
  })
}

export const getSourceParams = (type) => {
  return objectFilter(SOURCE_TYPES_PARAMS, ([key, param])=>{
    return !param.types || param.types.includes(type);
  })
}

export const pythonArguments = (defaultParams = {}, params = {}) => {
  var codes = [];

  Object.entries(defaultParams).forEach(([key, param])=>{

    let str = false;

    let value = (params[key] !== undefined) ? params[key] : param.value;

    if (param.nullable && !value) {
      value = undefined;
    }

    if (value!==undefined && param && !param.noCode) {

      switch (param.type) {
        case 'int':
          str = `${key}=${+(value || 0)}`;
          break;

        case undefined:
        case 'const':
          str = `${key}=${value}`;
          break;

        case 'string':
          str = `${key}="${value}"`;
          break;

        case 'boolean':
          str = `${key}=${(value && value!=0 && value!='false') ? 'True' : 'False'}`;
          break;

        case 'int array':
          str = `${key}=[${value.map(v=>+v).join(', ')}]`;
          break;

        case 'const array':
          str = `${key}=[${value.map(v=>v).join(', ')}]`;
          break;

        case 'columns':
        case 'string array':
          str = `${key}=[${value.map(v=>`"${v}"`).join(', ')}]`;
          break;

        case 'boolean array':
          str = `${key}=[${value.map(v=>(v && v!=0 && v!='false') ? 'True' : 'False').join(', ')}]`;
          break;

        case 'dict':
          str = `${key}={${Object.entries(value).map(([key, v])=>`"${key}": "${v}"`).join(', ')}}`;
          break;

        case 'kwargs':
          str = `${Object.entries(value).map(([k, v])=>`${k}="${v}"`).join(', ')}`;
          break;
      }

      if (str) {
        codes.push(str);
      }

    }
  })

  return codes.join(', ')

}

export const objectToPythonDictString = (object) => {
  return JSON.stringify(object).replace(/(\b|,|\{|\[)(null)([\b|,|\]|\}])/g,"$1None$3").replace(/(\b|,|\{|\[)(false)([\b|,|\]|\}])/g,"$1False$3").replace(/(\b|,|\{|\[)(true)([\b|,|\]|\}])/g,"$1True$3");
}

// constants

export const SECTION_NAMES = {
  JOIN: 'Join',
  ROWS: 'Rows functions',
  COLUMNS: 'Column managing functions',
  TRANSFORMATIONS: 'Transformation functions',
  STRING: 'String functions',
  MATH: 'Math functions',
  TRIGONOMETRIC: 'Trigonometric functions',
  TIME: 'Time and Date',
  URLEMAIL: 'Web related functions',
  ML: 'Machine Learning'
}

export const ENGINES = {
  'dask': 'Dask',
  'dask_cudf': 'Dask-cuDF',
  'cudf': 'cuDF',
  'pandas': 'Pandas',
  'spark': 'Spark',
  'ibis': 'Ibis',
  'dask_coiled': 'Dask (Coiled)',
  'dask_cudf_coiled': 'Dask cuDF (Coiled)'
}

export const INCOMPATIBLE_ENGINES = [
  ENGINES.spark,
  ENGINES.ibis
]

export const INIT_PARAMS = {
  'engine': {
    type: 'hidden',
    default: 'pandas'
  },
  'jupyter_ip': {
    type: 'hidden'
  },
  'jupyter_port': {
    type: 'hidden'
  },
  'reset': {
    type: 'hidden'
  },
  //?
  // 'address': {
  //   type: 'string',
  //   engines: ['dask', 'dask_cudf']
  // },
  'coiled_token': {
    type: 'string',
    private: true,
    name: 'Coiled token',
    engines: ['dask_coiled', 'dask_cudf_coiled']
  },
  'name': {
    type: 'string',
    name: 'Cluster name',
    engines: ['dask_coiled', 'dask_cudf_coiled']
  },

  'options': {
    type: 'string',
    large: true,
    engines: ['spark']
  },

  'n_workers': {
    type: 'int',
    name: 'Number of workers',
    engines: ['dask', 'dask_cudf', 'dask_coiled', 'dask_cudf_coiled'],
    default: '1',
    fill: true
  },
  // TODO: Show more fields switch
  'processes': {
    type: 'boolean',
    name: 'Use processes instead of threads',
    engines: ['dask'],
    default: true,
    // noForm: true
  },
  'threads_per_worker': {
    type: 'int',
    engines: ['dask', 'dask_cudf'],
    default: '8'
  },
  'scheduler_port': {
    type: 'int',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'silence_logs': {
    type: 'int',
    noForm: true,
    name: 'Logging level',
    default: '30',
    items: {
      '50': 'CRITICAL',
      '40': 'ERROR',
      '30': 'WARNING',
      '20': 'INFO',
      '10': 'DEBUG',
      '0': 'NOTSET'
    },
    engines: ['dask', 'dask_cudf']
  },
  'process': {
    type: 'string',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'host': {
    type: 'string',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'diagnostics_port': {
    type: 'int',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'asynchronous': {
    type: 'boolean',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'blocked_handlers': {
    type: 'string array',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'service_kwargs': {
    type: 'dict',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  // Security or bool
  'Security': {
    type: 'boolean',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'protocol': {
    type: 'string',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'interface': {
    type: 'string',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'worker_class': {
    type: 'Worker',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'worker_kwargs': {
    type: 'kwargs',
    noForm: true,
    engines: ['dask', 'dask_cudf']
  },
  'worker_memory': {
    type: 'string',
    engines: ['dask_coiled', 'dask_cudf_coiled']
  },
  'worker_cpu': {
    type: 'int',
    engines: ['dask_coiled', 'dask_cudf_coiled']
  },
  'scheduler_memory': {
    type: 'string',
    engines: ['dask_coiled', 'dask_cudf_coiled']
  },
  'scheduler_cpu': {
    type: 'int',
    engines: ['dask_coiled', 'dask_cudf_coiled']
  },
  'backend_region': {
    type: 'string',
    engines: ['dask_coiled', 'dask_cudf_coiled']
  },
  'idle_timeout': {
    type: 'string',
    engines: ['dask_coiled', 'dask_cudf_coiled']
  },
  'memory_limit': {
    type: 'string',
    default: '4 GB',
    engines: ['dask', 'dask_cudf']
  },
  'optimusPath': {
    name: 'Optimus installation path',
    type: 'string'
  },
  // 'kwargs': {
  //   type: 'kwargs'
  //  }
}

export const TYPES = {
  INT: "int",
  FLOAT: "float",
  STRING: "string",
  BOOLEAN: "boolean",
  DATETIME: "datetime",
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
  "float": "#.##",
  "string": "ABC",
  "boolean": "0/1",
  "datetime": "📅",
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
  "time": "time",
  "null": "null"
}

export const TYPES_NAMES = {
  "int": "Integer",
  "float": "Decimal",
  "string": "String",
  "boolean": "Boolean",
  "datetime": "Datetime",
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

export const CAST_NAMES = {
  "float": "Decimal",
  "integer": "Integer",
  "string": "String",
  "boolean": "Boolean",
  // "datetime": "Datetime"
}

export const ALL_TYPES = Object.values(TYPES)

export const STRING_TYPES = [
  TYPES.STRING,
  TYPES.OBJECT,
  TYPES.CATEGORICAL,
  TYPES.DATETIME,
  TYPES.TIME
]

const _TIME = {
  year: ['year','%Y'],
  yearShort: ['year (short)','%y'],
  month: ['month name','%B'],
  monthShort: ['month name (short)','%b'],
  monthNumber: ['month as a number','%m'],
  day: ['day of month','%d'],
  weekday: ['weekday','%A'],
  weekdayShort: ['weekday (short)','%a'],
  weekdayNumber: ['weekday as a number','%w'],
  hour: ['hour (00-12)','%I'],
  hour24: ['hour (00-23)','%H'],
  ampm: ['AM/PM','%p'],
  minute: ['minute','%M'],
  utc: ['UTC offset','%z'],
  timezone: ['Timezone','%Z'],
  dayNumber: ['day number of year','%S'],
  weekNumberM: ['weekday of year (Mon as 1st)','%U'],
  weekNumberS: ['weekday of year (Sun as 1st)','%W']
}

export const TIME_NAMES = objectMap(_TIME,([name, value])=>name)
export const TIME_VALUES = objectMap(_TIME,([name, value])=>value)

export const TIME_BETWEEN = {
  years: 'years',
  months: 'months',
  days: 'days',
  hours: 'hours',
  minutes: 'minutes',
  seconds: 'seconds'
}

export const CONNECTION_TYPES = {
  s3: "S3",
  hdfs: "HDFS",
  gcs: "Google Cloud Storage",
  adl: "Azure Data Lake",
  abfs: "Azure Blob",
  http: "HTTP",
  ftp: "FTP"
}

export const ALL_CONNECTION_TYPES = Object.keys(CONNECTION_TYPES)

export const CONNECTION_TYPES_PARAMS = {
  'endpoint_url': {
    type: 'string',
    types: ['s3']
  },
  'bucket': {
    name: 'Bucket name',
    type: 'string',
    types: ['s3']
  },
  'key': {
    type: 'string',
    types: ['s3']
  },
  'secret': {
    type: 'string',
    private: true,
    types: ['s3']
  },
  'host': {
    name: 'Server host',
    type: 'string',
    types: ['hdfs']
  },
  'port': {
    name: 'Server port',
    type: 'string',
    types: ['hdfs']
  },
  'user': {
    type: 'string',
    types: ['hdfs']
  },
  'password': {
    type: 'string',
    private: true,
    types: ['hdfs']
  },
  'kerb_ticket': {
    name: 'Path to Kerberos Ticket',
    type: 'string',
    advanced: true,
    types: ['hdfs']
  },
  'base_url': {
    name: 'Url',
    type: 'string',
    types: ['adl', 'abfs', 'gcs', 'http', 'ftp']
  },
  'tenant_id': {
    name: 'Tenant ID',
    type: 'string',
    types: ['adl']
  },
  'client_id': {
    name: 'Tenant ID',
    type: 'string',
    types: ['adl']
  },
  'client_secret': {
    type: 'string',
    private: true,
    types: ['adl']
  },
  'account_name': {
    type: 'string',
    types: ['abfs']
  },
  'account_secret': {
    type: 'string',
    private: true,
    types: ['abfs']
  },
  'token': {
    type: 'string',
    private: true,
    types: ['gcs']
  },
}

export const DATABASE_TYPES = {
  mysql: 'MySQL',
  sqlite: 'SQLite',
  postgres: 'PostgreSQL',
  oracle: 'Oracle',
  mssql: 'Microsoft SQL Server',
  bigquery: 'BigQuery',
  redshift: 'Redshift',
  cassandra: 'Cassandra',
  presto: 'Presto',
  redis: 'Redis'
}

export const ALL_DATABASE_TYPES = Object.keys(DATABASE_TYPES)

export const DATABASE_TYPES_PARAMS = {
  'oracle_type': {
    name: 'Type',
    type: 'string',
    noCode: true,
    types: ['oracle'],
    default: 'oracle_sid',
    items: {
      'oracle_sid': 'SID',
      'oracle_service_name': 'Service name',
      'oracle_tns': 'TNS',
    }
  },
  'sid': {
    name: 'SID',
    type: 'string',
    types: ['oracle'],
    condition: (c)=>(c.type=='oracle' && c.oracle_type=='oracle_sid'),
  },
  'service_name': {
    type: 'string',
    types: ['oracle'],
    condition: (c)=>(c.type=='oracle' && c.oracle_type=='oracle_service_name'),
  },
  'tns': {
    name: 'TNS',
    type: 'string',
    types: ['oracle'],
    condition: (c)=>(c.type=='oracle' && c.oracle_type=='oracle_tns'),
  },
  'project': {
    types: ['bigquery'],
    type: 'string',
  },
  'dataset': {
    types: ['bigquery'],
    type: 'string',
  },
  'keyspace': {
    types: ['cassandra'],
    type: 'string',
  },
  'table': {
    types: ['cassandra'],
    type: 'string',
  },
  'table': {
    types: ['cassandra'],
    type: 'string',
  },
  'host': {
    name: 'Host',
    type: 'string',
    types: [...ALL_DATABASE_TYPES, "hdfs"],
    condition: (c)=>(c.type!='oracle' || c.oracle_type!='oracle_tns') && c.type!='cassandra',
  },
  'port': {
    name: 'Port',
    type: 'string',
    types: [...ALL_DATABASE_TYPES, "hdfs"],
    condition: (c)=>(c.type!='oracle' || c.oracle_type!='oracle_tns') && c.type!='cassandra',
  },
  'catalog': {
    types: ['presto'],
    type: 'string',
  },
  'database': {
    types: ALL_DATABASE_TYPES,
    type: 'string',
  },
  'schema': {
    types: ALL_DATABASE_TYPES,
    type: 'string',
  },
  'user': {
    types: [...ALL_DATABASE_TYPES, "hdfs"],
    type: 'string'
  },
  'password': {
    types: [...ALL_DATABASE_TYPES, "hdfs"],
    type: 'string',
    private: true
  },

}

export const SOURCE_TYPES = {
  ...CONNECTION_TYPES,
  ...DATABASE_TYPES
}

export const SOURCE_TYPES_PARAMS = {
  ...CONNECTION_TYPES_PARAMS,
  ...DATABASE_TYPES_PARAMS
}

export const ALL_SOURCE_TYPES = [ ...ALL_CONNECTION_TYPES, ...ALL_DATABASE_TYPES ]

export const URL_FUNCTIONS = {
  "domain": "Domain",
  "sub_domain": "Subdomain",
  "top_domain": "Top-level domain",
  "url_scheme": "Url scheme",
  "host": "Host",
  "port": "Port",
  "url_path": "Url path",
  "url_params": "Url params"
}

export const EMAIL_FUNCTIONS = {
  "email_domain": "Email domain",
  "email_username": "Email username"
}

export const RESPONSE_MESSAGES = {
  'login': {
    201: 'Ok',
    401: 'Invalid credentials',
    403: 'Unauthorized user',
    404: 'User not found',
    500: 'Something went wrong'
  },
  'user': {
    201: 'User account successfully created',
    401: 'Invalid credentials',
    403: 'Unauthorized user',
    404: 'User not found',
    500: 'Something went wrong'
  },
  'default': {
    404: 'Server not found',
    500: 'Something went wrong'
  }
}

export const INTERCOM_APP_ID = 'evbcuhoh';
export const HELP_LINK = false; // "https://hi-bumblebee.com";

export const AUTO_UPLOAD_LIMIT = 104857600; // 100 MiB = 100*1024*1024

export default {
  ErrorWithResponse,
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
  getColumnsRange,
  escapeQuotes,
  adaptValue,
  filterCells,
  getOutputColsArgument,
  aggOutputCols,
  preparedColumns,
  columnsHint,
  formFromParam,
  escapeQuotesOn,
  handleResponse,
  printError,
  getProperty,
  getPropertyAsync,
  namesToIndices,
  indicesToNames,
  capitalizeString,
  decapitalizeString,
  nameify,
  spanClass,
  hlParam,
  hlCols,
  multipleContent,
  everyRatio,
  propsToLocal,
  objectFilter,
  objectMap,
  objectMapEntries,
  objectMapFromEntries,
  getCodePayload,
  transformDateToPython,
  transformDateFromPython,
  replaceTags,
  getEngines,
  getDefaultParams,
  engineValid,
  getInitParams,
  getSourceParams,
  pythonArguments,
  objectToPythonDictString,
  ENGINES,
  INCOMPATIBLE_ENGINES,
  INIT_PARAMS,
  TYPES,
  TYPES_HINTS,
  TYPES_NAMES,
  CAST_NAMES,
  TIME_NAMES,
  TIME_VALUES,
  TIME_BETWEEN,
  ALL_TYPES,
  STRING_TYPES,
  CONNECTION_TYPES,
  ALL_CONNECTION_TYPES,
  CONNECTION_TYPES_PARAMS,
  DATABASE_TYPES,
  ALL_DATABASE_TYPES,
  DATABASE_TYPES_PARAMS,
  SOURCE_TYPES,
  ALL_SOURCE_TYPES,
  URL_FUNCTIONS,
  EMAIL_FUNCTIONS,
  SOURCE_TYPES_PARAMS,
  RESPONSE_MESSAGES,
  INTERCOM_APP_ID,
  HELP_LINK,
  AUTO_UPLOAD_LIMIT
}

// exports.meta = require('./package.json')

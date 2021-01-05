import { escapeQuotes, escapeQuotesOn, getOutputColsArgument, preparedColumns, transformDateToPython, getCodePayload, TIME_VALUES } from 'bumblebee-utils'

export const version = function() {
  console.log("Code api 0.0.2")
}

export const codeGenerators = {
  profile: () => `.profile(columns="*")`,
  uploadToS3: (payload) => {
    return `.save.${payload.file_type}( filename="s3://${payload.bucket}/${payload.username}/${payload.file_name}.${payload.file_type}", storage_options={ "key": "${payload.access_key_id}", "secret": "${payload.secret_key}", "client_kwargs": { "endpoint_url": "https://${payload.endpoint}", }, "config_kwargs": {"s3": {"addressing_style": "virtual", "x-amz-acl": "public/read"}} } );`
  },
  saveToLocal: (payload) => {
    return `.save.${payload.file_type}( "${payload.local_address}/${payload.file_name}.${payload.file_type}" );`
  },
  saveFile: (payload) => {
    var file_type = payload.url.split('.');
    file_type = file_type[file_type.length - 1];
    return `.save.${file_type}( "${payload.url}" );`;
  },
  toPandas: (payload) => {
    return `.to_optimus_pandas()`;
  },
  compile: (payload) => {
    return `.compile()`;
  },
  patterns_count: (payload) => {
    return {
      code: `_output = ${payload.dfName}.cols.pattern_counts("${payload.column}", n=${payload.n}, mode=${payload.mode})`,
      isOutput: true
    };
  },
  'apply sort': (payload) => {
    return `.cols.sort(columns=${preparedColumns(payload.columns)})`
  },
  DROP_KEEP: (payload) => {
    return `.cols.${payload.command}(${preparedColumns(payload.columns)})`
  },
  'sort rows': (payload) => {
    var _argument = (payload.columns.length==1) ?
      `"${payload.columns[0]}","${payload.orders[0]}"` :
      `[${payload.columns.map((e,i)=>(`("${e}","${payload.orders[i]}")`)).join(',')}]`
    return `.rows.sort( ${_argument} )`
  },
  REMOVE_KEEP_SET: (payload) => {

    var dfName = `df`;

    if (payload.rowsType==='values' && payload.selection && payload.selection.map) {
      payload.selection = payload.selection.map(v=>escapeQuotes(v));
    }
    if (payload.selection && payload.selection.map && payload.rowsType==='values') {
      payload.selection = payload.selection.map(v=>`"${v}"`);
    }

    var expression = '';

    switch (payload.rowsType) {
      case 'missing':
        expression = `${dfName}["${payload.columns[0]}"].isnull()`;
        break;
      case 'mismatch':
        expression = `${dfName}.cols.mismatch("${payload.columns[0]}", "${payload.columnDataTypes[0]}")`;
        break;
      case 'values':
        expression = `${dfName}["${payload.columns[0]}"].isin([${payload.selection.join(',')}])`;
        break;
      case 'ranges':
        if (payload.selection.length>1) {
          expression = '('
          +payload.selection.map(range=>`(${dfName}["${payload.columns[0]}"]>=${range[0]}) & (${dfName}["${payload.columns[0]}"]<=${range[1]})`).join(' | ')
          +')';
        } else {
          expression = `(${dfName}["${payload.columns[0]}"]>=${payload.selection[0][0]}) & (${dfName}["${payload.columns[0]}"]<=${payload.selection[0][1]})`;
        }
        break;
      default:
        break;
    }

    if (payload.action==='set') {
      var output_col = payload.columns[0];
      var code = '';
      var value = ( (payload.value) ? `p.parse('${payload.value}')` : 'None' );
      if (!['final','processing'].includes(payload.request.type)) {
        output_col = '__new__'+output_col;
        code = `.rows.find( expr='${expression}', output_col="__match__" )`;
        if (payload.preview.filteredPreview) {
          code += `.rows.select( '__match__' )`;
        }
        code += `.cols.set( `
          + (payload.columns[0] ? `default="${payload.columns[0]}", ` : '')
          + `value=${value}, where='__match__', output_cols=["${output_col}"] )`;
        if (payload.request.type === 'preview' && payload.preview.filteredPreview) {
          return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '');
        }
        return code;
      }
      return code + `.cols.set( `
        + (payload.columns[0] ? `default="${payload.columns[0]}", ` : '')
        +`value=${value}, where=${expression}, output_cols=["${output_col}"] )`;

    } else {
      if (!['final','processing'].includes(payload.request.type)) {
        var code = `.rows.find( expr='${expression}', output_col="__match__" )`
        if (payload.preview.filteredPreview) {
          code += `.rows.select( '__match__' )`
        }
        if (payload.request.type === 'preview' && payload.preview.filteredPreview) {
          return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
        }
        return code
      } else {
        return `.rows.${payload.action}( expr='${expression}' )` // rows.select rows.drop
      }
    }
  },
  'filter rows': (payload) => {

    var expression = payload.expression
    var dfName = `df`

    try {
      payload = escapeQuotesOn(payload, ['text',])
    } catch (error) {
      console.error(error)
    }

    if (!['less','greater','between'].includes(payload.condition)) {
      payload.value = `"${payload.value}"`
      payload.value_2 = `"${payload.value_2}"`
      payload.values = payload.values.map(v=>`"${v}"`)
    }

    switch (payload.condition) {
      case 'null':
        expression = `${dfName}["${payload.columns[0]}"].isnull()`
        break
      case 'mismatch':
        expression = `~${dfName}.cols.is_match("${payload.columns[0]}", "${payload.columnDataTypes[0]}")`
        break
      case 'exactly':
        expression = `${dfName}["${payload.columns[0]}"]==${payload.value}`
        break
      case 'oneof':
        expression = `${dfName}.${payload.columns[0]}.isin([${payload.values.join(', ')}])`
        break
      case 'not':
        expression = `${dfName}["${payload.columns[0]}"]!=${payload.value}`
        break
      case 'less':
        expression = `${dfName}["${payload.columns[0]}"]<=${payload.value}`
        break
      case 'greater':
        expression = `${dfName}["${payload.columns[0]}"]>=${payload.value}`
        break
      case 'pattern':
        expression = `${dfName}.cols.select("${payload.columns[0]}").cols.pattern()["${payload.columns[0]}"]==${payload.value}`
        break
      case 'between':
        expression = `(${dfName}["${payload.columns[0]}"]>=${payload.value}) & (${dfName}["${payload.columns[0]}"]<=${payload.value_2})`
        break
      case 'contains':
      case 'startswith':
      case 'endswith':
        expression = `${dfName}["${payload.columns[0]}"].str.${payload.condition}("${payload.text}", na=False)`
        break
      case 'custom':
        expression = `${payload.expression}`
      default:
    }
    if (!['final','processing'].includes(payload.request.type)) {
      var code = `.rows.find( expr='${expression}', output_col="__match__" )`
      if (payload.preview.filteredPreview) {
        code += `.rows.select( '__match__' )`
        if (payload.request.type === 'preview') {
          return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
        }
      }
      return code
    } else {
      return `.rows.${payload.action}( expr='${expression}' )`
    }
  },
  'drop empty rows': (payload) => {
    if (!['final','processing'].includes(payload.request.type)) {
      var code = `.rows.find_nulls(` // mask.nulls
      + (payload.subset.length ? `columns=${preparedColumns(payload.subset, true)}, ` : '')
      + `how="${payload.how}", output_col="__match__" )`
      if (payload.preview.filteredPreview) {
        code += `.rows.select( '__match__' )`
        if (payload.request.type === 'preview') {
          return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
        }
      }
      return code
    }
    return  `.rows.drop_na(` // rows.drop mask.na
      + (payload.subset.length ? `columns=${preparedColumns(payload.subset, true)}, ` : '')
      + `how="${payload.how}")`
  },
  'drop duplicates': (payload) => {
    if (!['final','processing'].includes(payload.request.type)) {
      var code = `.rows.find_duplicated(` // mask.duplicated
      + (payload.subset.length ? `columns=${preparedColumns(payload.subset, true)}, ` : '')
      + `keep="${payload.keep}", output_col="__match__")`
      if (payload.preview.filteredPreview) {
        code += `.rows.select( '__match__' )`
        if (payload.request.type === 'preview') {
          return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
        }
      }
      return code
    }
    return `.rows.drop_duplicates(` // rows.drop mask.duplicated
      + (payload.subset.length ? `columns=${preparedColumns(payload.subset, true)}, ` : '')
      + `keep="${payload.keep}")`
  },
  concat: (payload) => {

    var cols_map = payload.selected_columns.map(e=>{
      var items = e.items.map(item=>item ? `"${item.name}"` : 'False')
      return `"${e.value}": [${items.join(', ')}]`
    })

    cols_map = `{ ${cols_map.join(', ')} }`

    var datasets = payload.with.map(({name})=>name).join(', ')

    if (!['final','processing'].includes(payload.request.type)) {
      datasets = payload.with.map(({name})=>`${name}.buffer_window("*", 0, 3)`).join(', ')
      return `.rows.append([${datasets}], ${cols_map})`;
    }

    return `.rows.append([${datasets}], ${cols_map})`;
  },
  join: (payload) => {

    var columnsLeft = payload.selected_columns.filter(c=>c.source==='left').map(c=>c.name);
    var columnsRight = payload.selected_columns.filter(c=>(c.name && c.source==='right')).map(c=>c.name);

    var columnsLeftEnd = Array.from(columnsLeft)
    var columnsRightEnd = Array.from(columnsRight)

    for (const index in columnsLeftEnd) {
      var found = columnsRightEnd.indexOf(columnsLeftEnd[index])
      if (found<0 || (columnsLeftEnd[index]==payload.left_on && columnsRightEnd[found]==payload.right_on) ) {
        continue
      }
      columnsLeftEnd[index] = columnsLeftEnd[index]+'_left'
      columnsRightEnd[found] = columnsRightEnd[found]+'_right'
    }

    var columnsEnd = [...new Set([...columnsLeftEnd, ...columnsRightEnd])]

    var filterEnd = columnsEnd.length ? `.cols.select(["${columnsEnd.join('", "')}"])` : '';

    if (columnsLeft.indexOf(payload.left_on)===-1) {
      columnsLeft.push(payload.left_on)
    }
    if (columnsRight.indexOf(payload.right_on)===-1) {
      columnsRight.push(payload.right_on)
    }

    var filterLeft = columnsLeft.length ? `.cols.select(["${columnsLeft.join('", "')}"])` : '*';
    var filterRight = columnsRight.length ? `.cols.select(["${columnsRight.join('", "')}"])` : '*';

    // filterEnd = filterLeft = filterRight = ''

    if (!['final','processing'].includes(payload.request.type)) {
      return (from, to) => {
        var window = ''
        if (from!==undefined) {
          window = `,${from},${to}`
        }
        return `${filterLeft}.cols.join(${payload.with}.buffer_window("*"${window})${filterRight}`
        + `, left_on="${payload.left_on}"`
        + `, right_on="${payload.right_on}", how="${payload.how}")${filterEnd}`
      }
    } else {
      return `${filterLeft}.cols.join(${payload.with}${filterRight}`
        + `, left_on="${payload.left_on}"`
        + `, right_on="${payload.right_on}", how="${payload.how}")${filterEnd}`
    }

  },
  aggregations: (payload) => {
    var output_cols_default = payload.output_cols_default(payload)

    var aggregations = payload.aggregations.map((oname,i)=>`"${payload.output_cols[i] || output_cols_default[i]}": {"${payload.input_cols[i]}":"${payload.aggregations[i]}"}`)

    aggregations = [...new Set(aggregations)]

    var code = ''

    code += `.cols.groupby(by="${payload.group_by[0]}", agg={`
    code += aggregations.join(', ')
    code += `})`

    if (payload.request.type === 'preview') {
      return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
    }

    return code
  },
  STRING: (payload) => {

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')

    var _argument = preparedColumns(payload.columns);

    return `.cols.${payload.command}(${_argument}`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  SUBSTR1: (payload) => {

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '');

    var commands = {
      left_string: 'left',
      right_string: 'right'
    };

    var command = commands[payload.command];

    var _argument = preparedColumns(payload.columns);

    return `.cols.${command}(${_argument}, n=${+payload.n}`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  mid_string: (payload) => {

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '');

    var _argument = preparedColumns(payload.columns);

    return `.cols.mid(${_argument}, start=${+payload.start}, n=${+payload.n}`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  pad_string: (payload) => {

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '');

    var _argument = preparedColumns(payload.columns);

    return `.cols.pad(${_argument}, width=${+payload.width}, side="${payload.side}", fillchar="${payload.fillchar}"`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  extract: (payload) => {

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '');

    var _argument = preparedColumns(payload.columns);

    return `.cols.extract(${_argument}, regex="${payload.regex}"`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  set_profiler_dtypes: (payload) => {

    var _argument = '{' + payload.columns.map(c=>`"${c}": "${payload.dtype}"`).join(', ') + '}';
    return `.cols.set_profiler_dtypes(${_argument})`

  },
  fill_na: (payload) => {
    var _argument = preparedColumns(payload.columns);
    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')
    payload = escapeQuotesOn(payload,['fill'])
    return `.cols.fill_na(`
      +_argument
      +`, "${payload.fill}"`
      +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      +')'
  },
  'load file': (payload) => {
    let file = {
      header: (payload.header) ? `True` : `False`,
      multiline: (payload.multiline) ? `True` : `False`,
    }

    payload = escapeQuotesOn(payload,['sep','null_value','sheet_name','_datasetName','url'])

    var code = ''

    var loadType = (!payload._moreOptions) ? 'file' : payload.file_type

    var url = payload.url.trim() || payload.external_url.trim()

    code +=`op.load.${loadType}("${url}"`
    if (loadType=='csv') {
      code += `, sep="${payload.sep}"`
      code += `, error_bad_lines=False`
      code += `, header=${file.header}`
      code += `, null_value="${payload.null_value}"`
      code += `, infer_schema="true"`
      code += `, encoding="${payload.charset}"`
    }
    else if (loadType=='json') {
      code += `, multiline=${file.multiline}`
    }
    else if (loadType=='xls') {
      if (payload._sheet_names.length) {
        code += `, sheet_name="${payload.sheet_name}"`
      } else {
        code += `, sheet_name=${payload.sheet_name}`
      }
    }
    if (!['final','processing'].includes(payload.request.type)) {
      var limit = 35
      if (payload.limit>0 && payload.limit<limit) {
        limit = payload.limit
      }
      code +=`, n_rows=${limit}`
    } else if (payload.limit>0) {
      code +=`, n_rows=${payload.limit}`
    }
    if (loadType!='file') {
      code += `, quoting=0, lineterminator=None, cache=True`
    } else if (payload.url.endsWith('.xls') || payload.url.endsWith('.xlsx')) {
      if (payload._sheet_names.length) {
        code += `, sheet_name="${payload.sheet_name}"`
      } else {
        code += `, sheet_name=${payload.sheet_name}`
      }
    }
    code += `)`

    return code
  },

  fingerprint: (payload) => {
    return {
      code: `from optimus.engines.dask.ml import keycollision as kc\n`
        + `_output = kc.fingerprint_cluster(${payload.dfName}.buffer_window("*"), input_cols=${preparedColumns(payload.columns)})`,
      isOutput: true
    };
  },

  n_gram_fingerprint: (payload) => {
    return {
      code: `from optimus.engines.dask.ml import keycollision as kc\n`
        + `_output = kc.n_gram_fingerprint_cluster(${payload.dfName}.buffer_window("*"), input_cols=${preparedColumns(payload.columns)}, n_size=${payload.n_size})`,
      isOutput: true
    };
  },

  stringClustering: (payload) => {
    return payload.clusters
    .filter(cluster=>cluster.selected.length)
    .map(cluster=>{
      var values = cluster.selected.map(e=>escapeQuotes(e.value))
      replace = escapeQuotes(cluster.replace)
      return `.cols.replace(`
      +`"${payload.columns[0]}"`
      +`, search=["${values.join('","')}"]`
      +`, replace_by="${replace}"`
      +`, search_by="full"`
      +')'
    })
    .join('')
  },
  'transform_format': (payload) => {
    var _argument = preparedColumns(payload.columns);
    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')
    return `.cols.date_format(${_argument}, "${transformDateToPython(payload.current_format)}", "${transformDateToPython(payload.output_format)}"`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  'get_from_datetime': (payload) => {
    var _argument = preparedColumns(payload.columns);
    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')
    return `.cols.date_format(${_argument}, "${transformDateToPython(payload.current_format)}", "${TIME_VALUES[payload.output_type]}"`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  outliers: (payload) => {
    if ( ['z_score','modified_z_score'].includes(payload.algorithm) ) {
      return `${payload.code_done}${'\n'}outlier.${payload.action=='Drop' ? 'drop' : 'select'}()`
    }
    else {

      // TODO various ranges
      return payload.selection.map(selection=>`.rows.between(`
      +`"${payload.columns[0]}"`
      +`, lower_bound=${selection[0]}`
      +`, upper_bound=${selection[1]}`
      +`, invert=${payload.action=='Drop' ? 'True' : 'False'}`
      +')'
      ).join('')
    }
  },
  createDatabase: (payload) => {
    var code = `${payload.varName} = ${payload.opName}.connect(driver="${payload.driver}"`;

    payload.parameters.forEach(parameter => {
      code += `, ${parameter.key}="${parameter.value}"`;
    });

    code += ')';

    return { code, isOutput: true };
  },
  getDatabaseTables: (payload) => {
    return { code: `_output = ${payload.varName}.tables()`, isOutput: true };
  },
  columnsNames: (payload) => {
    return { code: `_output = ${payload.dfName}.cols.names()`, isOutput: true };
  },
  dataTypes: (payload) => {
    return { code: `_output = ${payload.dfName}.cols.profiler_dtypes(${preparedColumns(payload.columns)})`, isOutput: true };
  },
  frequency: (payload) => {
    return { code: `_output = ${payload.dfName}.cols.frequency(${preparedColumns(payload.columns)}, ${payload.n})`, isOutput: true };
  },
  loadDatabaseTable: (payload) => {
    var table = escapeQuotes(payload.table)
    var code = `db.table_to_df("${table}")`;
    return code;
  },
  'save to database': (payload) => {
    var table_name = escapeQuotes(payload.table_name)
    return `db.df_to_table(${payload.dfName}, table="${table_name}", mode="overwrite")`
  },
  stratified_sample: (payload) => {
    var _argument = preparedColumns(payload.columns);
    return `.stratified_sample(`
      +_argument
      +( (payload.seed) ? `, seed=${payload.seed}` : '')
      +')'
  },
  replace: (payload) => {
    var _argument = preparedColumns(payload.columns);

    if (payload.request.type === 'preview' || payload.request.type === 'profile') {
      payload.output_cols = payload.output_cols.map(col=>'__new__'+col)
    }

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')

    payload = escapeQuotesOn(payload,['replace','search_by'])
    var search = payload.search.map(v=>escapeQuotes(v))

    return `.cols.replace(`
      +_argument
      +`, search=["${search.join('","')}"]`
      +`, replace_by="${payload.replace}"`
      +`, search_by="${payload.search_by}"`
      +`, ignore_case=${!payload.match_case ? 'True' : 'False'}`
      +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      +')'
      +( (payload.request.type === 'preview') ? `.cols.find(${_argument}, sub=["${search.join('","')}"], ignore_case=${!payload.match_case ? 'True' : 'False'})` : '')
      +( (payload.request.type === 'preview' && payload.replace) ? `.cols.find(${output_cols_argument}, sub=["${payload.replace}"])` : '')
  },
  set: (payload) => {

    if (!['final','processing'].includes(payload.request.type)) {
      payload.output_col = '__new__' + payload.output_col;
    }

    if (!payload.output_cols.length) {
      payload.output_cols = [payload.output_col]
    }
    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')

    var value = ( (payload.value) ? `p.parse('${payload.value}')` : 'None' )

    var cb = (from, to) => {
      var window = ''

      if (from!==undefined) {
        window = `,${from},${to}`
      }

      return `.cols.set(`
      + (payload.columns[0] ? `default="${payload.columns[0]}", ` : '')
      + 'value='+value
      + ', output_cols=' + output_cols_argument
      + `)`
    }

    if (!['final','processing'].includes(payload.request.type)) {
      return cb
    } else {
      return cb()
    }

  },
  rename: (payload) => {
    if (payload.columns.length==1) {
      return `.cols.rename("${payload.columns[0]}", "${payload.output_cols[0]}")`
    }
    else {
      return `.cols.rename([${payload.columns.map((e,i)=>`("${e}", "${payload.output_cols[i]}")`)}])`
    }
  },
  unnest: (payload) => {
    var _argument = preparedColumns(payload.columns);
    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')
    payload = escapeQuotesOn(payload, ['separator'])

    var code = `.cols.unnest(`
      +_argument
      +( (payload.separator) ? `, separator="${payload.separator}"` : '')
      +( (payload.splits) ? `, splits=${payload.splits}` : '')
      +( (payload.index) ? `, index=${payload.index}` : '')
      +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      +( (payload.drop) ? ', drop=True' : '')
      +')'

    if (payload.request.type === 'preview') {
      code += `.cols.find(${_argument}, sub=["${payload.separator}"])`
    }
    return code
  },

  nest: (payload) => {
    var output_col = payload.output_col
    if (!output_col || !['final','processing'].includes(payload.request.type)) {
      output_col = payload.defaultOutputName
    }
    payload = escapeQuotesOn(payload,['separator','output_col'])
    return `.cols.nest(${preparedColumns(payload.columns)}`
    +( (payload.separator) ? `, separator="${payload.separator}"` : '')
    +`, output_col="${output_col}")`
    +( (payload.request.type === 'preview' && payload.separator) ? `.cols.find("${output_col}", sub=["${payload.separator}"])` : '')
  },
  duplicate: (payload) => {
    var _argument = preparedColumns(payload.columns);
    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')
    return `.cols.copy(`
      +_argument
      +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      +')'
  },
  bucketizer: (payload) => {
    // df.cols.bucketizer("id",2,"buckets_output")
    var _argument = preparedColumns(payload.columns);
    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')

    return `.cols.bucketizer(`
      + _argument
      + ( (payload.splits) ? `, ${payload.splits}` : '')
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + ')'
  },
  values_to_cols: (payload) => {
    return `.cols.values_to_cols("${payload.columns[0]}")`
  },
  string_to_index: (payload) => {
    // cols.string_to_index(input_cols, output_cols=None)
    var _argument = preparedColumns(payload.columns);

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')

    return `.cols.string_to_index(`
      + _argument
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + ')'
  },
  index_to_string: (payload) => {
    // cols.index_to_string(input_cols, output_cols=None)
    var _argument = preparedColumns(payload.columns);

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')

    return `.cols.index_to_string(`
      + _argument
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + ')'
  },
  ML: (payload) => {
    var _argument = preparedColumns(payload.columns);

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')

    return `.cols.${payload.command}(`
      + _argument
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + ')'
  },
  impute: (payload) => {
    // df.cols.impute(input_cols, data_type="continuous", strategy="mean", output_cols=None)
    var _argument = preparedColumns(payload.columns);

    var output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (!['final','processing'].includes(payload.request.type)) ? '__new__' : '')

    return `.cols.impute(`
      + _argument
      + `, "${payload.data_type}"`
      + `, "${payload.strategy}"`
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + ')'
  },
  sample_n: (payload) => {
    return `.sample(${payload.n})`
  },


}

export const getGenerator = function(generatorName = '', payload = {}) {
  var generator;
  if (payload && payload._custom && typeof payload._custom === 'function') {
    generator = payload._custom;
  } else {
    generator = codeGenerators[generatorName] || codeGenerators[payload.command] || codeGenerators[payload.type] || undefined;
  }
  return generator
}

export const generateCode = function(commands = [], _request = { type: 'processing' }, extraPayload = false, acceptStrings = true) {

  if (!Array.isArray(commands)) {
    commands = [commands];
  }

  var lines = [];

  var functionDefinitions = [];

  lines.push(...commands.filter(p=>p).map(_payload => {

    var customCodePayload;

    var command = _payload.command;

    var payload = _payload.payload || _payload;

    if (typeof payload === 'string') {
      return payload;
    } else if (payload._custom) {

      customCodePayload = getCodePayload(payload);

      if (customCodePayload.declaration && !functionDefinitions.includes(customCodePayload.declaration) && !_request._isReference) {
        functionDefinitions.push(customCodePayload.declaration);
        return customCodePayload.declaration+'\n'+customCodePayload.code;
      }
      return customCodePayload.code;
    }

    command = command || payload.command;

    var generator = getGenerator(command, payload);

    var code = '';

    if (generator || command === undefined) {

      if (command === undefined) {
        generator = false
      }

      var request = { ..._request, ...(payload.request || {}) };

      request.type = request.type || 'processing';

      var result = generator ? generator({
        ...payload,
        request
      }) : '';

      var resultCode = '';

      if (typeof result === 'object' && result) {
        resultCode = result.code || result;
      } else {
        resultCode = result;
      }

      if (typeof resultCode === 'function') {
        if (request.buffer && request.buffer.length) {
          resultCode = resultCode(request.buffer[0], request.buffer[1]);
        } else {
          resultCode = resultCode()
        }
      }

      if (payload.extraPayload && !extraPayload) {
        code += generateCode(payload.extraPayload, request, true);
      }

      if (payload.previousCode) {
        code = `${payload.previousCode}${'\n'}`;
      }

      if (result.isOutput || customCodePayload) {

        code += resultCode;

      } else {

        var saving = false;

        var dfName = payload.dfName || request.dfName;

        if (dfName && !request.noSave) {
          request.save = true;
        }

        var multiOutput = (!!request.profile +!!request.sample +!!request.matches_count +!!request.meta)>1;
        var anyOutput = (request.profile || request.sample || request.matches_count || request.meta);

        if (request.saveTo) {
          code += `${request.saveTo} = `;
          saving = request.saveTo;
        } else if (request.isLoad) {
          var newDfName = payload.newDfName || request.newDfName;
          code += `${newDfName} = `;
          saving = newDfName;
        } else if (request.save) {
          code += `${dfName} = `;
          saving = dfName;
        } else if (multiOutput) {
          if (generator || request.buffer) {
            code += '_df_output = ';
            saving = '_df_output';
          } else {
            saving = dfName;
          }
        }

        if (!saving) {
          code += '_output = ';
        }

        var usesVar = generator || (!multiOutput && ( request.buffer || request.profile || request.matches_count ))

        if (!request.isLoad) {
          if (usesVar) {
            code += dfName;
            if (request.buffer) {
              var window = '';
              if (Array.isArray(request.buffer)) {
                window = `, ${request.buffer[0]}, ${request.buffer[1]+1}`;
              }
              code += `.buffer_window("*"${window})`;
            }
          }
        }

        code += resultCode;

        if (request.createsNew && saving && saving !== '_df_output' && request.type==='processing' && ['spark', 'ibis'].includes(request.engine)) {
          code += '\n'+`${saving} = ${saving}.to_optimus_pandas()`;
        }

        if (request.createsNew && ['final', 'processing'].includes(request.type)) {
          code += '\n'+`${saving} = ${saving}.repartition(8)`;
        }

        if ((saving !== '_df_output') && request.isLoad && !request.noExecute && saving && usesVar && ['final', 'processing'].includes(request.type)) {
          code += `.execute()`;
        }

        if (multiOutput || saving) {
          if (anyOutput) {
            code += '\n_output = {}';
          }
          if (request.sample) {
            code += '\n'+`_output.update({ 'sample': ${saving}.columns_sample("*") })`
          }
          if (request.profile) {
            code += '\n'+`_output.update({ 'profile': ${saving}.profile(columns=${preparedColumns(request.profile)}) })`;
          }
          if (request.matches_count) {
            code += '\n'+`_output.update({ 'matches_count': ${saving}.rows.select(${saving}["__match__"]).rows.count() })`
          }
          if (request.meta) {
            code += '\n'+`_output.update({ "meta": ${saving}.meta })`
          }
        } else {
          if (request.sample) {
            code += '.columns_sample("*")';
          }
          if (request.profile) {
            code += `.profile(columns=${preparedColumns(request.profile)})`;
          }
          if (request.matches_count) {
            code += `.rows.select(${saving}["__match__"]).rows.count()`;
          }
          if (request.meta) {
            code += '\n'+`.meta`
          }
        }

        if (saving === '_df_output') {
          code += '\ndel _df_output'
        }
      }
    }

    return code;

  }))

  return lines.join('\n');

}

export default {
  version,
  getGenerator,
  generateCode
}

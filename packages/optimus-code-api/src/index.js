import { deepCopy, escapeQuotes, adaptValue, escapeQuotesOn, getOutputColsArgument, aggOutputCols, preparedColumns, transformDateToPython, getCodePayload, getSourceParams, pythonArguments, trimCharacters, TIME_VALUES } from 'bumblebee-utils';

import { v4 as uuidv4 } from "uuid";

export const version = function() {
  console.log("Code api 0.0.3")
}

export const defaultTemplate = {
  start: payloads => '',
  body: payloads => {
    return payloads.map(payload => payload.code).join('\n')
  },
  end: payloads => ''
};

export const prefectTemplate = {
  start: payloads => {
    let globalVarNames = payloads.map(payload => [payload.target, payload.saving, ...(payload.sources || [])]).flat(1).filter(c => c);
    globalVarNames = [...new Set(globalVarNames)];

    if (payloads.some(payload => payload.isAsync)) {
      globalVarNames.push('_output_callback');
    }

    globalVarNames.push('states');

    return `
states = []
@flow
def operations_flow():
    global ${globalVarNames.join(', ')}
    `
  },
  body: payloads => {
    return payloads.map((payload, index) => {
      if (payload.isAsync) {
        return '\n' + payload.code.split('\n').map(line => `    ${line}`).join('\n')
             + '\n    states.append(None)';
      }
      let dfNames = (payload.sources || []).filter(c => c);
      let toReturn = [payload.target, payload.saving, ...(payload.sources || [])].filter(c => c);
      toReturn = [...new Set(toReturn)];
      let code = '\n' + payload.code.split('\n').map(line => `        ${line}`).join('\n');
      return `
    @task
    def task_${index}(${dfNames.join(', ')}):
        ${code}
        return ${toReturn.join(', ')}

    future = task_${index}(${dfNames.join(', ')})
    states.append(future.get_state().type.value)
    ${toReturn.join(', ')} = prefect_result(future)
    `
    }).join('\n')
  },
  end: payloads => `run_flow_on_jupyter(operations_flow); res.update({'states': states})`
}

export const payloadPreparers = {
  Download: (command, env) => {

    let payload = command.payload;

    payload = {
      ...payload,
      file_name: `${payload.username}-${payload.workspace}-dataset-${uuidv4()}`,
      file_type: 'csv',
      endpoint: env.DO_ENDPOINT,
      access_key_id: env.DO_ACCESS_KEY_ID,
      secret_key: env.DO_SECRET_KEY,
      bucket: env.DO_BUCKET,
      local_address: env._path+'/assets'
    };

    if (!payload.url) {
      payload.url = `${payload.local_address}/${payload.file_name}.${payload.file_type}`;
    }

    if (env.INSTANCE === 'LOCAL') {
      payload.download_url = `${env.BACKEND_URL}/datasource/local/${payload.file_name}.${payload.file_type}`;
      command = {
        payload,
        command: 'saveFile',
      };
    } else {
      payload.download_url = `https://${env.DO_BUCKET}.${env.DO_ENDPOINT}/${payload.username}/${payload.file_name}.${payload.file_type}`;
      command = {
        payload,
        command: 'uploadToS3',
      };
    }

    return command;
  }
}

export const codeGenerators = {
  get: (payload) => {
    let source = payload.source;
    if (payload.toString) {
      source = `str(${source})`
    }
    return { code: `_output = ${source}`, isOutput: true }
  },
  profile: (payload) => ({ code: `_output = ${payload.dfName}.profile(cols="*")`, isOutput: true }),
  uploadToS3: (payload) => {
    let code = `${payload.dfName}.save.${payload.file_type}( filename="s3://${payload.bucket}/${payload.username}/${payload.file_name}.${payload.file_type}", storage_options={ "key": "${payload.access_key_id}", "secret": "${payload.secret_key}", "client_kwargs": { "endpoint_url": "https://${payload.endpoint}", }, "config_kwargs": {"s3": {"addressing_style": "virtual", "x-amz-acl": "public/read"}} } );`;

    if (payload.download_url) {
      code += `\n_output = {"download_url": "${payload.download_url}"}`;
    } else {
      code = `_output = ${code}`;
    }

    return {
      code,
      isOutput: true
    };
  },
  inject: (payload) => {
    // get the function name if it is not passed
    if (!payload.functionName) {
      let match = payload.definition.match(/^def (.+__.+)\(/m);
      if (match && match.length) {
        payload.functionName = match[1];
      }
    }
    let code = "";
    code += `${payload.definition}\n`;
    code += `inject_method_to_optimus(${payload.functionName})\n`;
    code += `_output = "Injected ${payload.functionName}"`;
    return {
      code,
      isOutput: true
    };
  },
  delete: (payload) => {
    let code = "";
    code += `try:\n`;
    code += `    del ${payload.dfName}\n`;
    code += `    _output = "Deleted ${payload.dfName}"\n`;
    code += `except NameError:\n`;
    code += `    _output = "${payload.dfName} not found or already deleted"`;
    return {
      code,
      isOutput: true
    };
  },
  saveFile: (payload) => {

    let file_type = payload.file_type;

    if (!file_type) {
      if (payload.url) {
        file_type = payload.url.split('.');
        file_type = file_type[file_type.length - 1];
      } else {
        file_type = 'csv';
      }
    }

    let code = `${payload.dfName}.save.${file_type}("${payload.url}"`;
    if (payload.conn) {
      code += `, conn=${payload.conn}`;
    }
    code += `)`;

    if (payload.download_url) {
      code += `\n_output = {"download_url": "${payload.download_url}"}`;
    } else {
      code = `_output = ${code}`;
    }

    return {
      code,
      isOutput: true
    }
  },
  execute: (payload) => {
    return {code: `${payload.dfName} = ${payload.dfName}.execute()\n_output = "ok"`, isOutput: true}
  },
  toPandas: (payload) => {
    return `.to_optimus_pandas()`;
  },
  compile: (payload) => {
    return `.compile()`;
  },
  deck_map: (payload) => {
    let df = payload.dfName;
    return {
      code: `_output = ${df}.deck_map(${preparedColumns(payload.columns)})\n`,
      isOutput: true,
      isAsync: false
    };
  },
  pattern_counts_cache: (payload) => {
    let df = payload.dfName;
    let column = escapeQuotes(payload.column);
    let code =  `_output = ${df}.pattern_counts_cache("${column}", `
    code += `n=${payload.n}, `;
    code += `mode=${payload.mode}, `;
    code += `sample=[${payload.sample.join(", ")}], `;
    code += `last_sample=${payload.lastSample ? 'True' : 'False'}, `;
    code += `flush=${payload.clearPrevious ? 'True' : 'False'}`;
    code += `)\n`;
    return {
      code,
      isOutput: true,
      isAsync: false
    };
  },
  pattern_counts: (payload) => {
    return {
      code: `_output = ${payload.dfName}.cols.pattern_counts("${escapeQuotes(payload.column)}", n=${payload.n}, mode=${payload.mode})`,
      isOutput: true
    };
  },
  pattern_counts_async: (payload) => {
    let code =  "";
    code += `def _output_callback(fut):\n`;
    code += `    global ${payload.dfName}\n`;
    code += `    ${payload.dfName} = getattr(fut, "result", fut.result)()\n`;
    code += `    return ${payload.dfName}.cols.pattern_counts("${escapeQuotes(payload.column)}", n=${payload.n}, mode=${payload.mode})\n`;
    code += `_output = op.submit(${payload.dfName}.pattern_counts_df, "${escapeQuotes(payload.column)}", n=${payload.n}, mode=${payload.mode}, priority=${payload.request.priority || 0}, pure=False)\n`;
    return {
      code,
      isOutput: true,
      isAsync: true
    };
  },
  preliminary_profile_partial: (payload) => {
    return {
      code: `_output = ${payload.dfName}.preliminary_profile(${payload.dfName}.cols.names("*")[${payload.range.join(":")}])\n`,
      isOutput: true,
      isAsync: false
    };
  },
  preliminary_profile_async_partial: (payload) => {
    let selection = payload.range ? `[${payload.range.join(":")}]` : '';
    let code = "";
    code += `def _output_callback(fut):\n`;
    code += `    return fut.result()\n`;
    code += `_output = op.submit(${payload.dfName}.preliminary_profile, ${payload.dfName}.cols.names("*")${selection}, priority=${payload.request.priority || 0}, pure=False)\n`;
    return {
      code,
      isOutput: true,
      isAsync: true
    };
  },
  preliminary_profile_async: (payload) => {
    let code =  "";
    code += `def _output_callback(fut):\n`;
    code += `    return fut.result()\n`;
    code += `_output = op.submit(${payload.dfName}.preliminary_profile, ${payload.columns || '"*"'}, priority=${payload.request.priority || 0}, pure=False)\n`;
    return {
      code,
      isOutput: true,
      isAsync: true
    };
  },
  preliminary_profile: (payload) => {
    let code =  `_output = ${payload.dfName}.preliminary_profile(${preparedColumns(payload.columns)}`;
    code += payload.n ? `, bins=${payload.n}` : '';
    code += `)\n`;
    return {
      code,
      isOutput: true,
      isAsync: false
    };
  },
  profile_partial: (payload) => {
    let selection = payload.range ? `[${payload.range.join(":")}]` : '';
    return {
      code: `_output = ${payload.dfName}.profile(${payload.dfName}.cols.names("*")${selection})\n`,
      isOutput: true,
      isAsync: false
    };
  },
  profile_cache: (payload) => {
    let code =  `_output = ${payload.dfName}.profile_cache(${preparedColumns(payload.columns)}, `
    code += payload.n ? `bins=${payload.n}, ` : '';
    code += `sample=[${payload.sample.join(", ")}], `;
    code += `last_sample=${payload.lastSample ? 'True' : 'False'}, `;
    code += `flush=${payload.clearPrevious ? 'True' : 'False'}`;
    code += `)\n`;
    return {
      code,
      isOutput: true,
      isAsync: false
    };
  },
  profile_cache_partial: (payload) => {
    let selection = payload.range ? `[${payload.range.join(":")}]` : '';
    let code =  `_output = ${payload.dfName}.profile_cache(${payload.dfName}.cols.names("*")${selection}, `
    code += payload.n ? `bins=${payload.n}, ` : '';
    code += `sample=[${payload.sample.join(", ")}], `;
    code += `last_sample=${payload.lastSample ? 'True' : 'False'}, `;
    code += `flush=${payload.clearPrevious ? 'True' : 'False'}`;
    code += `)\n`;
    return {
      code,
      isOutput: true,
      isAsync: false
    };
  },
  profile_async_partial: (payload) => {
    let selection = payload.range ? `[${payload.range.join(":")}]` : '';
    let code = "";
    code += `def _output_callback(fut):\n`;
    code += `    global ${payload.dfName}\n`;
    code += `    ${payload.dfName} = fut.result()\n`;
    code += `    return ${payload.dfName}.profile(${payload.dfName}.cols.names("*")${selection})\n`;
    code += `_output = op.submit(${payload.dfName}.profile_df, ${payload.dfName}.cols.names("*")${selection}, priority=${payload.request.priority || 0}, pure=False)\n`;
    return {
      code,
      isOutput: true,
      isAsync: true
    };
  },
  profile_async: (payload) => {
    let code =  "";
    code += `def _output_callback(fut):\n`;
    code += `    global ${payload.dfName}\n`;
    code += `    ${payload.dfName} = fut.result()\n`;
    code += `    return ${payload.dfName}.profile(${payload.columns || '"*"'})\n`;
    code += `_output = op.submit(${payload.dfName}.profile_df, ${payload.columns || '"*"'}, priority=${payload.request.priority || 0}, pure=False)\n`;
    return {
      code,
      isOutput: true,
      isAsync: true
    };
  },
  applySort: (payload) => {
    return `.cols.sort(cols=${preparedColumns(payload.columns)})`
  },
  DROP_KEEP: (payload) => {
    return `.cols.${payload.command}(${preparedColumns(payload.columns)})`
  },
  sortRows: (payload) => {
    let _argument = (payload.columns.length==1) ?
      `"${payload.columns[0]}", "${payload.orders[0]}"` :
      `[${payload.columns.map((e,i)=>(`("${e}", "${payload.orders[i]}")`)).join(',')}]`;
    return `.rows.sort( ${_argument} )`;
  },
  REMOVE_KEEP_SET: (payload) => {

    let dfName = `df`;

    if (payload.selection && payload.selection.map && payload.rowsType==='values') {
      payload.selection = payload.selection.map(v=>{
        if (typeof v != "string") {
          return `${v}`
        } else {
          return `"${escapeQuotes(v)}"`
        }
      });
    }

    let expression = '';

    switch (payload.rowsType) {
      case 'match':
        expression = `${dfName}.mask.match("${payload.columns[0]}", "${payload.columnDataTypes[0]}")`;
        break;
      case 'missing':
        expression = `${dfName}.mask.null("${payload.columns[0]}")`;
        break;
      case 'mismatch':
        expression = `${dfName}.mask.mismatch("${payload.columns[0]}", "${payload.columnDataTypes[0]}")`;
        break;
      case 'values':
        expression = `${dfName}.mask.value_in("${payload.columns[0]}", [${payload.selection.join(',')}])`;
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

    if (payload.action == 'set') {
      let output_col = (payload.output_cols ? payload.output_cols[0] : false) || payload.columns[0];
      let code = '';
      let value = ( (payload.value) ? `parse('${payload.value}')` : 'None' );
      if (!['final','processing'].includes(payload.request.type)) {
        
        if (!payload.default && payload.columns[0]) {
          payload.default = `"${payload.columns[0]}"`;
        }

        output_col = '__new__'+output_col; // TODO support output_cols
        code = `.cols.set("__match__", '${expression}', `
        + (payload.default ? `default=${payload.default}, ` : '')
        + `eval_value=True)`;
        if (payload.preview.filteredPreview) {
          code += `.rows.null("__match__", drop=True)`;
        }

        code += `.cols.set(`
        + `"${output_col}", `
        + `value_func=${value}, `
        + `where='__match__', `
        + (payload.default ? `default=${payload.default}, ` : '')
        + `eval_value=True)`
        if (payload.request.type === 'preview' && payload.preview.filteredPreview) {
          return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '');
        }
        return code;
      }

      if (!payload.default && payload.columns[0]) {
        payload.default = `"${payload.columns[0]}"`;
      }

      return code + `.cols.set(`
        + `"${output_col}", `
        + `value_func=${value}, `
        + `where='${expression}', `
        + (payload.default ? `default=${payload.default}, ` : '')
        + `eval_value=True)`

    } else {
      if (!['final','processing'].includes(payload.request.type)) {
        let code = `.cols.set("__match__", '${expression}', `
        + (payload.default ? `default=${payload.default}, ` : '')
        + `eval_value=True)`;
        if (payload.preview.filteredPreview) {
          code += `.rows.null("__match__", drop=True)`
        }
        if (payload.request.type === 'preview' && payload.preview.filteredPreview) {
          return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
        }
        return code
      } else {
        return `.rows.${payload.action}( '${expression}' )` // rows.select rows.drop
      }
    }
  },
  filterRows: (payload) => {

    let expression = payload.expression
    let dfName = `df`

    payload = deepCopy(payload);

    let expressions = payload.expression.map((_, index) => {
        
      try {
        payload = escapeQuotesOn(payload, ['text']);
      } catch (error) {
        console.error(error);
      }

      if (!['less','greater','between'].includes(payload.condition[index])) {
        if (payload.request.isString) {
          payload.value[index] = `"${escapeQuotes(trimCharacters(payload.value[index], '"'))}"`;
          payload.value_2[index] = `"${escapeQuotes(trimCharacters(payload.value_2[index], '"'))}"`;
          payload.values[index] = (payload.values[index] || []).map(v=>`"${escapeQuotes(trimCharacters(v, '"'))}"`);
        } else {
          payload.value[index] = adaptValue(payload.value[index]);
          payload.value_2[index] = adaptValue(payload.value_2[index]);
          payload.values[index] = (payload.values[index] || []).map(adaptValue);
        }
      }

      switch (payload.condition[index]) {
        case 'null':
          expression = `${dfName}.mask.null("${payload.columns[0]}")`
          break
        case 'mismatch':
          expression = `${dfName}.mask.mismatch("${payload.columns[0]}", "${payload.columnDataTypes[0]}")`
          break
        case 'equal':
          expression = `${dfName}["${payload.columns[0]}"]==${payload.value[index]}`
          break
        case 'value_in':
          expression = `${dfName}.mask.value_in("${payload.columns[0]}", [${payload.values[index].join(',')}])`;
          break
        case 'not_equal':
          expression = `${dfName}["${payload.columns[0]}"]!=${payload.value[index]}`
          break
        case 'less_than':
          expression = `${dfName}["${payload.columns[0]}"]<=${payload.value[index]}`
          break
        case 'greater_than':
          expression = `${dfName}["${payload.columns[0]}"]>=${payload.value[index]}`
          break
        case 'match_pattern':
          expression = `${dfName}.mask.pattern("${payload.columns[0]}", ${payload.value[index]})`
          break
        case 'between':
          expression = `(${dfName}.mask.between("${payload.columns[0]}", ${payload.value[index]}, ${payload.value_2[index]})`
          break
        case 'contains':
        case 'starts_with':
        case 'ends_with':
          expression = `${dfName}.mask.${payload.condition[index]}("${payload.columns[0]}", "${payload.text[index]}")`
          break
        case 'where':
          expression = `${payload.expression[index]}`
        default:
      }
      return `'${expression}'`;
    });


    let output_col = payload.columns[0];

    if (!payload.default && payload.columns[0]) {
      payload.default = `"${payload.columns[0]}"`;
    }

    if (!['final','processing'].includes(payload.request.type)) {

      if (payload.action == 'set') {

        // preview set

        let code = `.cols.set("__match__"`
        + `, where=[${expressions.join(", ")}]`
        + `, value_func=[${payload.replace_value.map((_, i) => i+1).join(", ")}]`
        + `, eval_value=True, default=False)`;

        code += `.cols.set(`
        + `"__new__${output_col}"` // TODO support output_cols
        + `, where=[${expressions.map((_, i) => `'df["__match__"]==${i+1}'`).join(", ")}]`
        + `, value_func=[${payload.replace_value.map(v => v==undefined ? "None" : v).join(", ")}]`
        + `, eval_value=True`
        + (payload.default ? `, default=${payload.default}` : '')
        + `)`

        if (payload.preview.filteredPreview) {
          code += `.rows.null("__match__", drop=True)`
          if (payload.request.type === 'preview') {
            return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
          }
        }
        return code
      
      } else {

        // preview filter
        
        let code = `.cols.set("__match__", value_func=[${expressions.join(", ")}], `
        + `default=False, eval_value=True)`;
        if (payload.preview.filteredPreview) {
          code += `.rows.null("__match__", drop=True)`
          if (payload.request.type === 'preview') {
            return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
          }
        }
        return code

      }

    } else {
      if (payload.action == 'set') {

        // final set

        if (!payload.default && payload.columns[0]) {
          payload.default = `"${payload.columns[0]}"`;
        }
        return `.cols.set(`
        + `"${output_col}", `
        + `value_func=[${expressions.join(", ")}], `
        + (payload.default ? `default=${payload.default}, ` : '')
        + `eval_value=True)`
      } else {

        // final filter

        return `.rows.${payload.action}( [${expressions.join(", ")}] )`
      }
    }
  },
  dropEmptyRows: (payload) => {
    if (!['final','processing'].includes(payload.request.type)) {
      let code = `.cols.set("__match__", 'df.mask.null(`
      + (payload.subset.length ? `cols=${preparedColumns(payload.subset, true)}, ` : '')
      + `how="${payload.how}"`
      + `)', eval_value=True)`
      if (payload.preview.filteredPreview) {
        code += `.rows.null("__match__", drop=True)`
        if (payload.request.type === 'preview') {
          return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
        }
      }
      return code
    }
    return  `.rows.drop_null(` // rows.drop mask.na
      + (payload.subset.length ? `cols=${preparedColumns(payload.subset, true)}, ` : '')
      + `how="${payload.how}")`
  },
  dropDuplicates: (payload) => {
    if (!['final','processing'].includes(payload.request.type)) {
      let code = `.cols.set("__match__", 'df.mask.duplicated(`
      + (payload.subset.length ? `cols=${preparedColumns(payload.subset, true)}, ` : '')
      + `keep="${payload.keep}"`
      + `)', eval_value=True)`
      if (payload.preview.filteredPreview) {
        code += `.rows.null("__match__", drop=True)`
        if (payload.request.type === 'preview') {
          return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
        }
      }
      return code
    }
    return `.rows.drop_duplicated(` // rows.drop mask.duplicated
      + (payload.subset.length ? `cols=${preparedColumns(payload.subset, true)}, ` : '')
      + `keep="${payload.keep}")`
  },
  advancedEditRows: (payload) => {

    let funcDefinition = payload.funcDefinition || 'return row';
    let func_name = funcDefinition.match(/def (\w+)\(/);
    if (func_name) {
      func_name = func_name[1];
    } else {
      func_name = 'func';
      funcDefinition = funcDefinition.split('\n').map(line => '    '+line).join('\n');
      funcDefinition = `def ${func_name}(row):\n${funcDefinition}`;
    }

    return {
      preCode: funcDefinition,
      code: `.rows.apply(${func_name}, mode="map")`
    }

  },
  concat: (payload) => {

    let cols_map = payload.selected_columns.map(e=>{
      let items = e.items.map(item=>item ? `"${item.name}"` : 'False')
      return `"${e.value}": [${items.join(', ')}]`
    })

    cols_map = `{ ${cols_map.join(', ')} }`

    let datasets = payload.with.map(({name})=>name).join(', ')

    if (!['final','processing'].includes(payload.request.type)) {
      datasets = payload.with.map(({name})=>`${name}.iloc("*", 0, 3)`).join(', ')
      return `.rows.append([${datasets}], ${cols_map})`;
    }

    return `.rows.append([${datasets}], ${cols_map})`;
  },
  join: (payload) => {

    let columnsLeft = payload.selected_columns.filter(c=>c.source==='left').map(c=>c.name);
    let columnsRight = payload.selected_columns.filter(c=>(c.name && c.source==='right')).map(c=>c.name);

    let columnsLeftEnd = Array.from(columnsLeft)
    let columnsRightEnd = Array.from(columnsRight)

    for (const index in columnsLeftEnd) {
      let found = columnsRightEnd.indexOf(columnsLeftEnd[index])
      if (found<0 || (columnsLeftEnd[index]==payload.left_on && columnsRightEnd[found]==payload.right_on) ) {
        continue
      }
      columnsLeftEnd[index] = columnsLeftEnd[index]+'_left'
      columnsRightEnd[found] = columnsRightEnd[found]+'_right'
    }

    let columnsEnd = [...new Set([...columnsLeftEnd, ...columnsRightEnd])]

    let filterEnd = columnsEnd.length ? `.cols.select(["${columnsEnd.join('", "')}"])` : '';

    if (columnsLeft.indexOf(payload.left_on)===-1) {
      columnsLeft.push(payload.left_on)
    }
    if (columnsRight.indexOf(payload.right_on)===-1) {
      columnsRight.push(payload.right_on)
    }

    let filterLeft = columnsLeft.length ? `.cols.select(["${columnsLeft.join('", "')}"])` : '';
    let filterRight = columnsRight.length ? `.cols.select(["${columnsRight.join('", "')}"])` : '';

    // filterEnd = filterLeft = filterRight = ''

    if (!['final','processing'].includes(payload.request.type)) {
      return (from, to) => {
        let biggerWindow = `[0:${1000*((payload.request.retry || 0) + 1)}]`;
        let window = '';
        if (from!==undefined) {
          window = `[${from}:${to}]`;
        }
        return `${biggerWindow}${filterLeft}.join(${payload.with}${biggerWindow}${filterRight}`
          + `, left_on="${payload.left_on}"`
          + `, right_on="${payload.right_on}", how="${payload.how}")${window}${filterEnd}`;
      }
    } else {
      return `${filterLeft}.join(${payload.with}${filterRight}`
        + `, left_on="${payload.left_on}"`
        + `, right_on="${payload.right_on}", how="${payload.how}")${filterEnd}`;
    }

  },
  aggregations: (payload) => {
    let output_cols_default = aggOutputCols(payload)

    let aggregations = payload.aggregations.map((oname,i)=>`"${payload.output_cols[i] || output_cols_default[i]}": {"${payload.input_cols[i]}":"${payload.aggregations[i]}"}`)

    aggregations = [...new Set(aggregations)]

    let code = ''

    let groupby = `[${payload.group_by.map(v=>`"${v}"`).join(", ")}]`

    code += `.cols.groupby(by=${groupby}, agg={`
    code += aggregations.join(', ')
    code += `})`

    if (payload.request.type === 'preview') {
      return (from, to)=>code+(from!==undefined ? `[${from}:${to}]` : '')
    }

    return code
  },
  GENERIC: (payload) => {

    let cols_argument = payload.columns === false ? '' : preparedColumns(payload.columns);
    
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')

    let parameters = pythonArguments(payload.parameters || {}, payload);

    if ((cols_argument || output_cols_argument) && parameters) {
      parameters = ', ' + parameters;
    }

    let accessor = payload.accessor ? `${payload.accessor}.` : '';

    return `.${accessor}${payload.command}(${cols_argument}`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + ( parameters || '')
    + `)`;
  },
  MATH: (payload) => {

    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')

    let _argument = preparedColumns(payload.columns);

    return `.cols.${payload.command}(${_argument}`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  SUBSTRING: (payload) => {

    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__');

    let commands = {
      left_string: 'left',
      right_string: 'right'
    };

    let command = commands[payload.command];

    let _argument = preparedColumns(payload.columns);

    return `.cols.${command}(${_argument}, n=${payload.n}`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  mid_string: (payload) => {

    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__');

    let _argument = preparedColumns(payload.columns);

    return `.cols.mid(${_argument}, start=${payload.start}, n=${payload.end}`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  pad_string: (payload) => {

    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__');

    let _argument = preparedColumns(payload.columns);

    return `.cols.pad(${_argument}, width=${payload.width}, side="${payload.side}", fillchar="${payload.fillchar}"`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  extract: (payload) => {

    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__');

    let _argument = preparedColumns(payload.columns);

    return `.cols.extract(${_argument}, regex="${payload.regex}"`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`
  },
  set_data_type: (payload) => {

    let _argument = '{' + payload.columns.map(c=>`"${c}": "${payload.data_type}"`).join(', ') + '}';
    return `.cols.set_data_type(${_argument})`

  },
  fill_na: (payload) => {
    let _argument = preparedColumns(payload.columns);
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__');
    let value = ( (payload.fill) ? `parse('${payload.fill}')` : '""' );
    return `.cols.fill_na(`
      + _argument
      + `, ${value}`
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + `, eval_value=True)`;
  },
  createConnection: (payload) => {
    let code = `${payload.varName} = ${payload.opName || 'op'}.connect.${payload.type}(`
    code += pythonArguments(getSourceParams(payload.type), payload)
    code += `)`;

    return { code, isOutput: true };
  },
  loadFile: (payload) => {
    let file = {
      header: (payload.header) ? `True` : `False`,
      multiline: (payload.multiline) ? `True` : `False`,
    }

    payload = escapeQuotesOn(payload,['sep','null_value','sheet_name','_datasetName','url']);

    let code = '';

    let loadType = (payload._moreOptions && payload.file_type) ? payload.file_type : 'file';

    let loadTypes = {
      "xlsx": "excel",
      "xls": "excel"
    }

    if (loadType in loadTypes) {
      loadType = loadTypes[loadType];
    }

    let url = (payload.url || '').trim() || (payload.external_url || '').trim();

    url = url.replace(/ /g, '%20');

    code +=`op.load.${loadType}("${url}"`
    if (loadType=='csv') {
      code += `, sep="${payload.sep}"`
      code += `, header=${file.header}`
      code += `, null_value="${payload.null_value}"`
      code += `, infer_schema="true"`
      code += `, encoding="${payload.charset}"`
    }
    else if (loadType=='json') {
      code += `, multiline=${file.multiline}`
    }
    else if (loadType=='excel') {
      if (payload._sheet_names && payload._sheet_names.length) {
        code += `, sheet_name="${payload.sheet_name}"`
      } else {
        code += `, sheet_name=${payload.sheet_name}`
      }
    }
    let n_rows = payload.n_rows || Infinity;
    if (payload.request.type !== 'final') {
      n_rows = Math.min( n_rows, payload.sampleRows || Infinity);
    }
    if (!['final','processing'].includes(payload.request.type)) {
      let previewLimit = Math.min(35, n_rows)
      code +=`, n_rows=${previewLimit}`
    } else if (n_rows !== Infinity) {
      code +=`, n_rows=${n_rows}`
    }
    if (loadType == 'file' && (url.endsWith('.xls') || url.endsWith('.xlsx'))) {
      if (payload._sheet_names && payload._sheet_names.length) {
        code += `, sheet_name="${payload.sheet_name}"`
      } else {
        code += `, sheet_name=${payload.sheet_name}`
      }
    }
    if (payload.conn) {
      code += `, conn=${payload.conn}`
    }
    code += `)`

    return code
  },

  createDataframe: (payload) => {
    return `op.create.dataframe(${payload.dict})`;
  },

  fingerprint: (payload) => {
    return {
      code: `clusters = ${payload.dfName}.string_clustering(cols=${preparedColumns(payload.columns)}, algorithm="fingerprint")\n_output = clusters.to_dict(verbose=True)`,
      isOutput: true
    };
  },

  ngram_fingerprint: (payload) => {
    return {
      code: `clusters = ${payload.dfName}.string_clustering(cols=${preparedColumns(payload.columns)}, algorithm="ngram_fingerprint", n_size=${payload.n_size})\n_output = clusters.to_dict(verbose=True)`,
      isOutput: true
    };
  },

  metaphone: (payload) => {
    return {
      code: `clusters = ${payload.dfName}.string_clustering(cols=${preparedColumns(payload.columns)}, algorithm="metaphone")\n_output = clusters.to_dict(verbose=True)`,
      isOutput: true
    };
  },

  double_metaphone: (payload) => {
    return {
      code: `clusters = ${payload.dfName}.string_clustering(cols=${preparedColumns(payload.columns)}, algorithm="double_metaphone")\n_output = clusters.to_dict(verbose=True)`,
      isOutput: true
    };
  },

  nysiis: (payload) => {
    return {
      code: `clusters = ${payload.dfName}.string_clustering(cols=${preparedColumns(payload.columns)}, algorithm="nysiis")\n_output = clusters.to_dict(verbose=True)`,
      isOutput: true
    };
  },

  match_rating_codex: (payload) => {
    return {
      code: `clusters = ${payload.dfName}.string_clustering(cols=${preparedColumns(payload.columns)}, algorithm="match_rating_codex")\n_output = clusters.to_dict(verbose=True)`,
      isOutput: true
    };
  },

  soundex: (payload) => {
    return {
      code: `clusters = ${payload.dfName}.string_clustering(cols=${preparedColumns(payload.columns)}, algorithm="soundex")\n_output = clusters.to_dict(verbose=True)`,
      isOutput: true
    };
  },

  levenshtein: (payload) => {
    return {
      code: `clusters = ${payload.dfName}.string_clustering(cols=${preparedColumns(payload.columns)}, algorithm="levenshtein")\n_output = clusters.to_dict(verbose=True)`,
      isOutput: true
    };
  },

  stringClustering: (payload) => {
    return payload.clusters
    .filter(cluster=>cluster.selected.length)
    .map(cluster=>{
      let values = cluster.selected.map(e=>escapeQuotes(e.value))
      let replace = escapeQuotes(cluster.replace)
      return `.cols.replace(`
      +`"${payload.columns[0]}"`
      +`, search=["${values.join('","')}"]`
      +`, replace_by="${replace}"`
      +`, search_by="full"`
      +')'
    })
    .join('')
  },
  
  removeStopWords: (payload) => {
    let _argument = preparedColumns(payload.columns);
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__');
    return `.cols.remove_stopwords(${_argument}`
    +`, language="${payload.language}"`
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    +')'
  },

  transformFormat: (payload) => {
    let _argument = preparedColumns(payload.columns);
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__');
    return `.cols.format_date(${_argument}`
    + ( payload.current_format ? `, current_format="${transformDateToPython(payload.current_format)}"` : '')
    + ( payload.output_format ? `, output_format="${transformDateToPython(payload.output_format)}"` : '')
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`;
  },
  extractFromDatetime: (payload) => {
    let _argument = preparedColumns(payload.columns);
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__');
    return `.cols.format_date(${_argument}`
    + ( payload.current_format ? `, current_format="${transformDateToPython(payload.current_format)}"` : '')
    + ( payload.extract_value ? `, output_format="${TIME_VALUES[payload.extract_value]}"` : '')
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`;
  },
  betweenTimeUnits: (payload) => {
    let _argument = preparedColumns(payload.columns);
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__');
    return `.cols.${payload.unit}_between(${_argument}`
    + ( payload.value ? `, value="${payload.value}"` : '')
    + ( payload.date_format ? `, date_format="${transformDateToPython(payload.date_format)}"` : '')
    + ( payload.round ? `, round="${payload.round}"` : '')
    + ( output_cols_argument ? `, output_cols=${output_cols_argument}` : '')
    + `)`;
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
    payload.password = payload.password || "";
    let code = `${payload.varName} = ${payload.opName || 'op'}.connect.${payload.type}(`;
    code += pythonArguments(getSourceParams(payload.type), payload);
    code += ')';

    return { code, isOutput: true };
  },
  getDatabaseTables: (payload) => {
    return { code: `_output = ${payload.dbName}.tables()`, isOutput: true };
  },
  columnsNames: (payload) => {
    return { code: `_output = ${payload.dfName}.cols.names()`, isOutput: true };
  },
  dataTypes: (payload) => {
    return { code: `_output = ${payload.dfName}.cols.inferred_data_type(${preparedColumns(payload.columns)}, use_internal=True, tidy=False)["inferred_data_type"]`, isOutput: true };
  },
  frequency: (payload) => {
    return { code: `_output = ${payload.dfName}.cols.frequency(${preparedColumns(payload.columns)}, ${payload.n})`, isOutput: true };
  },
  loadDatabaseTable: (payload) => {
    let table = escapeQuotes(payload.table)
    let code = `${payload.dbName}.table_to_df("${table}")`;
    return code;
  },
  saveDatabaseTable: (payload) => {
    let table_name = escapeQuotes(payload.table_name)
    return {
      code: `_output = ${payload.dbName}.df_to_table(${payload.dfName}, table="${table_name}", mode="overwrite")`,
      isOutput: true
    }
  },
  stratified_sample: (payload) => {
    let _argument = preparedColumns(payload.columns);
    return `.stratified_sample(`
      +_argument
      +( (payload.seed) ? `, seed=${payload.seed}` : '')
      +')'
  },
  replace: (payload) => {
    let _argument = preparedColumns(payload.columns);

    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')

    let replaces = payload.replace;

    if (payload._replace_by_string) {
      replaces = replaces.map(replace=>`"${escapeQuotes(replace)}"`);
    }

    replaces = replaces.map(replace=>replace ? replace : 'None');

    let searchs = payload.search

    if (payload._search_by_string) {
      searchs = searchs.map(search=>'['+search.map(v=>`"${escapeQuotes(v)}"`).join(', ')+']');
    }

    searchs = searchs.map((search, i) => `(${search}, ${replaces[i]})`);

    let str = `.cols.replace(`
      +_argument
      +`, search=[${searchs.join(', ')}]`
      +`, search_by="${payload.search_by}"`
      +`, ignore_case=${!payload.match_case ? 'True' : 'False'}`
      +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      +')';

    // if (payload._search_by_string) {
    //   str += ( (['profile', 'preview'].includes(payload.request.type) && _argument) ? `.cols.find(${_argument}, sub=[${search.join(',')}], ignore_case=${!payload.match_case ? 'True' : 'False'})` : '');
    // }

    // if (payload._replace_by_string) {
    //   str += ( (['profile', 'preview'].includes(payload.request.type) && payload.replace && output_cols_argument) ? `.cols.find(${output_cols_argument}, sub=["${payload.replace}"])` : '');
    // }

    return str;
  },
  set: (payload) => {

    if (!['final','processing'].includes(payload.request.type)) {
      payload.output_col = '__new__' + payload.output_col;
    }

    if (!payload.output_cols.length) {
      payload.output_cols = [payload.output_col]
    }
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')

    let value = ( (payload.value) ? `parse('${payload.value}')` : 'None' )

    let cb = (from, to) => {
      let window = ''

      if (from!==undefined) {
        window = `,${from},${to}`
      }

      return `.cols.set(`
      + `${output_cols_argument}, `
      + `value_func=${value}, `
      + `eval_value=True)`
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
    let _argument = preparedColumns(payload.columns);
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')
    payload = escapeQuotesOn(payload, ['separator'])

    let code = `.cols.unnest(`
      +_argument
      +( (payload.separator) ? `, separator="${payload.separator}"` : '')
      +( (payload.splits) ? `, splits=${payload.splits}` : '')
      +( (payload.index) ? `, index=${payload.index}` : '')
      +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      +( (payload.drop) ? ', drop=True' : '')
      +')'

    // if (payload.request.type === 'preview') {
    //   code += `.cols.find(${_argument}, sub=["${payload.separator}"])`
    // }
    return code
  },

  nest: (payload) => {
    let output_col = payload.output_col
    if (!output_col || !['final','processing'].includes(payload.request.type)) {
      output_col = payload.defaultOutputName
    }
    payload = escapeQuotesOn(payload,['separator','output_col'])
    return `.cols.nest(${preparedColumns(payload.columns)}`
    +( (payload.separator) ? `, separator="${payload.separator}"` : '')
    + `, drop="${payload.keep ? 'False' : 'True'}"`
    +`, output_col="${output_col}")`
    +( (payload.request.type === 'preview' && payload.separator) ? `.cols.find("${output_col}", sub=["${payload.separator}"])` : '')
  },
  duplicate: (payload) => {
    let _argument = preparedColumns(payload.columns);
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')
    return `.cols.copy(`
      +_argument
      +( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      +')'
  },
  bucketizer: (payload) => {
    let _argument = preparedColumns(payload.columns);
    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')

    return `.cols.bucketizer(`
      + _argument
      + ( (payload.splits) ? `, ${payload.splits}` : '')
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + ')'
  },
  values_to_cols: (payload) => {
    return `.cols.values_to_cols("${payload.columns[0]}")`
  },
  one_hot_encode: (payload) => {
    let _argument = preparedColumns(payload.columns);

    return `.cols.one_hot_encode(`
      + _argument
      + (payload.prefix ? `, prefix="${payload.prefix}"` : '')
      + `, drop="${payload.keep ? 'False' : 'True'}"`
      + ')'
  },
  string_to_index: (payload) => {
    let _argument = preparedColumns(payload.columns);

    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')

    return `.cols.string_to_index(`
      + _argument
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + ')'
  },
  index_to_string: (payload) => {
    let _argument = preparedColumns(payload.columns);

    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')

    return `.cols.index_to_string(`
      + _argument
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + ')'
  },
  impute: (payload) => {
    let _argument = preparedColumns(payload.columns);

    let output_cols_argument = getOutputColsArgument(payload.output_cols, payload.columns, (['final','processing',undefined].includes(payload.request.type)) ? '' : '__new__')

    return `.cols.impute(`
      + _argument
      + `, data_type="${payload.data_type}"`
      + `, strategy="${payload.strategy}"`
      + (payload.fill_value && payload.strategy == 'constant' ?`, fill_value=${payload.fill_value}` : '')
      + ( (output_cols_argument) ? `, output_cols=${output_cols_argument}` : '')
      + ')'
  },
  sample_n: (payload) => {
    return `.sample(${payload.n})`
  },


}

export const getPreparer = function(command = '', payload = {}) {
  return payloadPreparers[command] || payloadPreparers[payload.command] || payloadPreparers[payload.type] || undefined;
}

export const preparePayload = function(commands = [], env = {}) {
  if (!Array.isArray(commands)) {
    commands = [commands];
  }

  return commands.map(command => {
    if (!command.payload) {
      command = {
        payload: command,
        command: command.command
      };
    }
    if (Object.keys(payloadPreparers).includes(command.command)) {
      command = payloadPreparers[command.command](command, env);
    }
    return command;
  })
}

export const getGenerator = function(generatorName = '', payload = {}) {
  let generator;
  if (payload && payload._custom && typeof payload._custom === 'function') {
    generator = payload._custom;
  } else {
    generator = codeGenerators[generatorName] || codeGenerators[payload.command] || codeGenerators[payload.generator] || undefined;
  }
  return generator
}

export const generateCode = function(commands = [], _request = { type: 'processing' }, extraPayload = false, acceptStrings = true, template = false) {

  if (!Array.isArray(commands)) {
    commands = [commands];
  }

  let payloads = [];

  let functionDefinitions = [];

  let isAsync = undefined;

  commands = commands.filter(p=>p);

  if (commands.length > 1) {
    isAsync = false;
  }

  commands.forEach(_payload => {

    let customCodePayload;

    let command = _payload.command;

    let payload = _payload.payload || _payload;

    if (typeof payload === 'string') {
      if (acceptStrings) {
        return { code: payload }
      } else {
        return { error: 'String payloads are not accepted' }
      }
    } else if (payload._custom) {

      customCodePayload = getCodePayload(payload);

      let code;

      if (customCodePayload.declaration && !functionDefinitions.includes(customCodePayload.declaration) && !_request._isReference) {
        functionDefinitions.push(customCodePayload.declaration);
        code = customCodePayload.declaration+'\n'+customCodePayload.code;
      } else {
        code = customCodePayload.code;
      }
      return { code };
    }

    command = command || payload.command;

    let generator = getGenerator(command, payload);

    let code = '';
    let saving;
    let output;
    let dfName;
    let sources = [];

    if (generator || command === undefined) {

      if (command === undefined) {
        generator = false
      }

      let request = { ..._request, ...(payload.request || {}) };

      request.type = request.type || 'processing';

      let result = generator ? generator({
        ...payload,
        request
      }) : '';

      let resultCode = '';

      if (typeof result === 'object' && result) {
        resultCode = result.code || result;
      } else {
        resultCode = result;
      }

      if (typeof resultCode === 'function') {
        if (request.window && request.window.length) {
          resultCode = resultCode(request.window[0], request.window[1]);
        } else {
          resultCode = resultCode()
        }
      }

      if (payload.extraPayload && !extraPayload) {
        code += generateCode(payload.extraPayload, request, true)[0];
      }

      if (payload.previousCode) {
        code = `${payload.previousCode}${'\n'}`;
      }

      if (result.preCode) {
        code += result.preCode + '\n';
      }

      if (request.areSources) {
        request.areSources.forEach(name => {
          sources.push(payload[name]);
          sources = sources.flat();
        });
      }

      saving = false;
      dfName = payload.dfName || request.dfName;

      if (result.isOutput || customCodePayload) {

        code += resultCode;

        if (result.isAsync && isAsync === undefined) {
          isAsync = true;
        }

        output = '_output';

      } else {

        if (dfName && !request.noSave && payload.command) {
          request.save = true;
        }

        let multiOutput = (!!request.profile +!!request.sample +!!request.matches_count +!!request.meta)>1;
        let anyOutput = (request.profile || request.sample || request.matches_count || request.meta);

        if (request.saveTo) {
          code += `${request.saveTo} = `;
          saving = request.saveTo;
        } else if (request.createsNew && request.type==='processing') {
          let newDfName = payload.newDfName || request.newDfName;
          code += `${newDfName} = `;
          saving = newDfName;
        } else if (request.isLoad) {
          let newDfName = payload.newDfName || request.newDfName;
          code += `${newDfName} = `;
          saving = newDfName;
        } else if (request.save) {
          code += `${dfName} = `;
          saving = dfName;
        } else if (multiOutput) {
          if (generator || request.window) {
            code += '_df_output = ';
            saving = '_df_output';
          } else {
            saving = dfName;
          }
        }


        if (!saving) {
          if (request.isAsync && isAsync === undefined && !request.meta) {
            isAsync = true;
          }

          if (isAsync) {
            code += '_output = op.submit(';
          } else {
            code += '_output = ';
          }

          output = '_output';
        }

        let usesVar = generator || (!multiOutput && ( request.window || request.profile || request.matches_count ))

        if (!request.isLoad) {
          if (usesVar) {
            code += dfName;
            if (request.window) {
              let window = '';

              // set filtered preview request as not windowed operations

              if (payload?.preview?.filteredPreview && !request.noBufferWindow) {
                request.noBufferWindow = 'retry';
              }

              if (request.noBufferWindow === 'retry' && !request.retry) {
                request.noBufferWindow = false;
              }

              if (!request.noBufferWindow && Array.isArray(request.window)) {
                window = `, ${request.window[0]}, ${request.window[1]}`;
              }
              
              if (window) {
                code += `.iloc("*"${window})`;
              }
            }
          }
        }

        code += resultCode;

        let profileColumns;

        if (request.profile) {
          profileColumns = preparedColumns(request.profile, false, false);
          if (request.profile_partial) {
            profileColumns = `${dfName}.cols.names("*")[${Math.max(0,request.profile_partial-10)}:${request.profile_partial}]`;
          }
        }

        if (request.createsNew && saving && saving !== '_df_output' && request.type==='processing' && ['spark', 'ibis'].includes(request.engine)) {
          code += '\n'+`${saving} = ${saving}.to_optimus_pandas()`;
        }

        if (request.createsNew && ['final', 'processing'].includes(request.type)) {
          code += '\n'+`${saving} = ${saving}.repartition("auto")`;
        }

        if ((saving !== '_df_output') && request.isLoad && !request.noExecute && saving && usesVar && ['final', 'processing'].includes(request.type)) {
          code += `.execute()`;
        }

        if (multiOutput || saving) {

          // TODO: use multiple outputs and return using one_list_to_val

          output = '_output';

          if (anyOutput) {
            code += '\n_output = {}';
          }
          if (request.sample) {
            code += '\n'+`_output.update({ 'sample': ${saving}.columns_sample("*") })`
          }
          if (request.profile) {
            code += '\n'+`_output.update({ 'profile': ${saving}.preliminary_profile(cols=${profileColumns}) })`;
          }
          if (request.names) {
            code += '\n'+`_output.update({ 'names': ${saving}.cols.names() })`;
          }
          if (request.matches_count) {
            code += '\n'+`_output.update({ 'matches_count': ${saving}.rows.null("__match__", drop=True).rows.count() })`
          }
          if (request.meta) {
            code += '\n'+`_output.update({ 'meta': ${saving}.meta })`
          }

        } else {

          if (isAsync) {

            if (request.sample) {
              code += '.columns_sample, "*"';
            }
            if (request.profile) {
              code += `.profile, ${profileColumns}`;
            }
            if (request.names) {
              code += `.cols.names, "*"`;
            }
            if (request.matches_count) {
              code += `.rows.null("__match__", drop=True).rows.count`;
            }

            if (request.async_priority) {
              code += `, priority=${request.async_priority}`;
            }

            if (!request.pure) {
              code += `, pure=False`;
            }

            code += `)`;

          } else {

            if (request.sample) {
              code += '.columns_sample("*")';
            }
            if (request.profile) {
              code += `.profile(cols=${profileColumns})`;
            }
            if (request.names) {
              code += `.cols.names()`;
            }
            if (request.matches_count) {
              code += `.rows.null("__match__", drop=True).rows.count()`;
            }
            if (request.meta) {
              code += '\n'+`.meta`
            }

          }
        }

        // TODO: move to `end` template section
        if (saving === '_df_output') {
          code += '\ndel _df_output'
          saving = false;
        }
      }
    }

    payloads.push({...payload, target: output || saving || '_output', saving, sources: [dfName, ...sources], isAsync, code});

  });

  if (template && typeof template == 'object') {
    template = {
      ...defaultTemplate,
      ...template
    }
  } else {
    template = defaultTemplate;
  }

  let start = template.start(payloads);
  let body = template.body(payloads);
  let end = template.end(payloads);

  let content = [start, body, end].join('\n');

  return [ content, isAsync ];

}

export default {
  version,
  getPreparer,
  preparePayload,
  getGenerator,
  generateCode
}

import { getDefaultParams, engineValid, INIT_PARAMS } from 'bumblebee-utils';

const TIME_START = `
_use_time = True
try:
    _start_time = datetime.utcnow().timestamp()
except Exception:
    _use_time = False
`;

const TIME_END = `
if _use_time:
    _end_time = datetime.utcnow().timestamp()
    res.update({'_gatewayTime': {'start': _start_time, 'end': _end_time, 'duration': _end_time-_start_time}})
`;

const OUTPUT_JSON = `json.dumps(res,  default=json_converter, ensure_ascii=False)`

const codeTraceback = (code = '') => `

${TIME_START}
code = """${code}"""
res = {}
try:
    exec(code, globals())
except Exception as err:
    res.update({'traceback': traceback.format_exc()})
    res.update({'error': str(err)})

res.update({'result': _output})
${TIME_END}
${OUTPUT_JSON}
`;

const code = (code = '') => `

${TIME_START}
${code}
res = {'result': _output}
${TIME_END}
${OUTPUT_JSON}
`;

const datasetsMin = (payload) => `
{ _df: globals()[_df].cols.names() for (_df) in ipython_vars(globals(),"dask") }
`;

const datasets = (payload) => `

${TIME_START}

if ipython_vars:
    _dfs = ipython_vars(globals(),"dask")
else:
    _dfs = []

${TIME_END}

res = { _df: globals()[_df].cols.names() for (_df) in _dfs }
${OUTPUT_JSON}
`;

const features = (payload) => `

${TIME_START}

coiled_available = False
spark_available = False
coiled_gpu_available = False
rapids_available = False

try:
    import pyspark
    spark_available = True
except:
    spark_available = False

try:
    import coiled
    coiled_available = True
except:
    coiled_available = False

try:
    import dask
    import cudf
    import dask_cudf
    rapids_available = True
except:
    rapids_available = False

coiled_gpu_available = rapids_available and coiled_available

res = { "coiled_available": coiled_available, "coiled_gpu_available": coiled_gpu_available, "spark_available": spark_available, "rapids_available": rapids_available }

# optimus reserved words

try:
    from optimus.expressions import reserved_words
    res.update({'reserved_words': reserved_words})
except:
    pass

# optimus parser

try:
    from optimus.expressions import Parser
    p = Parser()
    res.update({'parser_available': True})
except:
    res.update({'parser_available': False})
    def p (a):
        return a


${TIME_END}

${OUTPUT_JSON}
`;

const initializationParameters = ( params: any = {} ) => {
  let str = ''

  Object.entries(params).forEach(([key, value]: [string, any])=>{

    if (value!==undefined && INIT_PARAMS[key] && !INIT_PARAMS[key].noCode && engineValid(key, params.engine)) {

      switch (INIT_PARAMS[key].type) {
        case 'int':
          str += `, ${key}=${+value}`;
          break;

        case 'const':
          str += `, ${key}=${value}`;
          break;

        case 'string':
          str += `, ${key}="${value}"`;
          break;

        case 'boolean':
          str += `, ${key}=${(value && value!=0 && value!='false') ? 'True' : 'False'}`;
          break;

        case 'int array':
          str += `, ${key}=[${value.map(v=>+v).join(', ')}]`;
          break;

        case 'const array':
          str += `, ${key}=[${value.map(v=>v).join(', ')}]`;
          break;

        case 'string array':
          str += `, ${key}=["${value.join('", "')}"]`;
          break;

        case 'boolean array':
          str += `, ${key}=["${value.map(v=>(v && v!=0 && v!='false') ? 'True' : 'False').join('", "')}"]`;
          break;

        case 'dict':
          str += `, ${key}={${Object.entries(value).map(([key, v]: [string, string])=>`"${key}": "${v}"`).join(', ')}}`;
          break;

        case 'kwargs':
          str += `, ${Object.entries(value).map(([key, v]: [string, string])=>`${key}="${v}"`).join(', ')}`;
          break;

      }
    }


  });

  return str;
}

const getParams = payload => {
  let params = {...(payload || {})};

  params = getDefaultParams(params)

  let functionParams = initializationParameters(params);

  switch (params.engine) {
    case 'dask_coiled':
      params.coiled = true;
      params.engine = 'dask';
      break
    case 'dask_cudf_coiled':
      params.coiled = true;
      params.engine = 'dask_cudf';
      break
  }

  return { params, functionParams };
}

const init = (payload, min = false) => {

  let { params, functionParams } = getParams(payload);

  let opInit = `engine = "${params.engine}"`;

  if (params.coiled_token) {
    opInit += `
dask.config.set({"coiled.token": '${params.coiled_token}'})
cluster = coiled.Cluster(${functionParams.substr(2)},
                         worker_options={
                          'nthreads': 8,
                         })
client = Client(cluster)
client_install = client.run(install)
op = Optimus(engine, session=client, memory_limit="1G")`;
  } else {
    opInit += `
op = Optimus(engine${functionParams})`;
  }

  if (min) {
    return opInit;
  }

  return `

def install ():
    from optimus import Optimus
    return 'ok'

reset = ${(params?.reset != '0') ? 'True' : 'False'}

try:
    json; date; datetime; ipython_vars; json_converter; traceback;
    assert (not reset)
except Exception:
    reset = True
    from datetime import datetime, date
    try:
        from optimus.helpers.functions import ipython_vars
    except Exception:
        ipython_vars = False
    import traceback
    import json
    from optimus.helpers.json import json_converter

${TIME_START}

res = { 'kernel': 'ok' }

engine = "${params.engine}"

coiled_token = ${ params.coiled_token ? 'True' : 'False' }
using_coiled = False
coiled_available = False

import cytoolz;

try:
    if coiled_token:
        import dask
        dask.config.set({"coiled.token": '${params.coiled_token}'})
    import coiled
    coiled.Cloud()
    coiled_available = True
    using_coiled = ${params.coiled ? 'True' : 'False'}
except:
    using_coiled = False
    coiled_available = False

# initialization

from optimus import Optimus
from dask.distributed import Client;
${opInit}
if (using_coiled):
    res.update({"coiled": True, "cluster_name": cluster.name, "dashboard_link": getattr(client, 'dashboard_link', None) if client else None, "client_install": client_install});
else:
    client = getattr(op, 'client', None)
    dashboard_link = getattr(op.client, 'dashboard_link', None) if client else None
    res.update({"dashboard_link": dashboard_link});
op_engine = getattr(op, 'engine', None)
res.update({'optimus': 'ok init', 'optimus_version': op.__version__, 'engine': op_engine, "coiled_available": coiled_available});

${TIME_END}

${OUTPUT_JSON}
`;
}

export default { init, datasets, features, code, datasetsMin };

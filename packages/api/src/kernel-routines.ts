import { INIT_PARAMETERS } from 'bumblebee-utils';

const codeTraceback = (code = '') => `

_use_time = True
try:
    _start_time = datetime.utcnow().timestamp()
except Exception:
    _use_time = False
code = """${code}"""
res = {}
try:
    exec(code, globals())
except Exception as err:
    res.update({'traceback': traceback.format_exc()})
    res.update({'error': str(err)})

res.update({'result': _output})
if _use_time:
    _end_time = datetime.utcnow().timestamp()
    res.update({'_gatewayTime': {'start': _start_time, 'end': _end_time, 'duration': _end_time-_start_time}})
json.dumps(res,  default=_json_default, ensure_ascii=False)
`;
const code = (code = '') => `

_use_time = True
try:
    _start_time = datetime.utcnow().timestamp()
except Exception:
    _use_time = False
${code}
res = {'result': _output}
if _use_time:
    _end_time = datetime.utcnow().timestamp()
    res.update({'_gatewayTime': {'start': _start_time, 'end': _end_time, 'duration': _end_time-_start_time}})
json.dumps(res,  default=_json_default, ensure_ascii=False)
`;

const datasetsMin = (payload) => `
{ _df: globals()[_df].cols.names() for (_df) in ipython_vars(globals(),"dask") }
`;

const datasets = (payload) => `

_use_time = True
try:
    _start_time = datetime.utcnow().timestamp()
except Exception:
    _use_time = False

if ipython_vars:
    _dfs = ipython_vars(globals(),"dask")
else:
    _dfs = []

if _use_time:
    _end_time = datetime.utcnow().timestamp()
    res = { _df: globals()[_df].cols.names() for (_df) in _dfs }
res.update({'_gatewayTime': {'start': _start_time, 'end': _end_time, 'duration': _end_time-_start_time}})
json.dumps(res,  default=_json_default, ensure_ascii=False)
`;

const initializationParameters = ( parameters: any = {} ) => {
  let str = ''
  Object.entries(parameters).forEach(([key, value]: [string, any])=>{

    if (value!==undefined && INIT_PARAMETERS[key] && (!INIT_PARAMETERS[key].engines || INIT_PARAMETERS[key].engines.includes(parameters.engine))) {

      switch (INIT_PARAMETERS[key].type) {
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


  })

  return str;
}

const getParams = payload => {
  let params = {...(payload || {})};

  params.engine = (params.engine !== undefined) ? params.engine : "dask"
  params.threads_per_worker = (params.threads_per_worker !== undefined) ? params.threads_per_worker : 8
  params.n_workers = (params.n_workers !== undefined) ? params.n_workers : 1

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

  let opInit = '';

  if (params.coiled) {
    opInit = `engine = "${params.engine}"; ` +
    'import coiled; ' +
    // `coiled.create_software_environment(name='zarr', conda=['xarray', 'zarr','dask=2.2.23','distributed']); ` +
    `coiled.create_cluster_configuration(${functionParams.substr(2)}); ` +
    `cluster = coiled.Cluster(configuration='${params.name}'); ` +
    `res.update({"cluster_name": cluster.name}); ` +
    `from dask.distributed import Client; ` +
    `client = Client(name=cluster.name); ` +
    `op = Optimus(engine, session=client, memory_limit="1G", comm=True)`
  } else {
    opInit = `engine = "${params.engine}"; ` +
    `op = Optimus(engine${functionParams}, memory_limit="1G", comm=True)`
  }

  if (min) {
    return opInit;
  }

  return `

reset = True # ${(params?.reset != '0') ? 'True' : 'False'}

try:
    json; date; datetime; ipython_vars; _json_default; traceback;
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
    def _json_default(o):
        if isinstance(o, (date, datetime)):
            return o.isoformat()

_use_time = True
try:
    _start_time = datetime.utcnow().timestamp()
except Exception:
    _use_time = False

res = { 'kernel': 'ok' }

engine = "${params.engine}"

try:
    from optimus.expressions import reserved_words, Parser
    res.update({'reserved_words': reserved_words})
    p = Parser()
except:
    def p (a):
        return a

try:
    op
    op.__version__
    op.engine
    if (reset or op.engine!=engine):
        raise Exception('Resetting')
    res.update({'optimus': 'ok', 'dependencies': 'ok', 'optimus_version': op.__version__, 'engine': op.engine})
    try:
        df
        res.update({'dataframe': 'ok'})
    except Exception:
        pass
except Exception:
    from optimus import Optimus
    ${opInit}
    res.update({'optimus': 'ok init', 'optimus_version': op.__version__, 'engine': op.engine})

if _use_time:
    _end_time = datetime.utcnow().timestamp()
    res.update({'_gatewayTime': {'start': _start_time, 'end': _end_time, 'duration': _end_time-_start_time}})
json.dumps(res,  default=_json_default, ensure_ascii=False)
`;
}

export default { init, datasets, code, datasetsMin };

import { getDefaultParams, engineValid, getInitParams, pythonArguments, INIT_PARAMS } from 'bumblebee-utils';

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

const code = (code = '') => `

${TIME_START}
${code}
res = {'result': _output}
${TIME_END}
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

coiled_gpu_available = coiled_available

res = { "coiled_available": coiled_available, "coiled_gpu_available": coiled_gpu_available, "spark_available": spark_available, "rapids_available": rapids_available }

# optimus reserved words

try:
    from optimus.expressions import reserved_words
    res.update({'reserved_words': reserved_words})
except:
    pass


${TIME_END}

${OUTPUT_JSON}
`;

const getParams = payload => {
  let params = {...(payload || {})};
  params = getDefaultParams(params);
  let functionParams = pythonArguments(getInitParams(params.engine), params);

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

// TODO: parser should be on the features routine but that routine is running in another session

const init = (payload, min = false) => {

  let { params, functionParams } = getParams(payload);

  let opInit = `engine = "${params.engine}"\nop = Optimus(engine, ${functionParams})`;

  if (min) {
    return opInit;
  }

  return `
reset = ${(params?.reset != '0') ? 'True' : 'False'}

try:
    json; date; datetime; json_converter;
    assert (not reset)
except Exception:
    reset = True
    from datetime import datetime, date
    import json
    from optimus.helpers.json import json_converter

${TIME_START}

res = { 'kernel': 'ok' }

try:
    from optimus.expressions import parse
    res.update({'parser_available': True})
except:
    res.update({'parser_available': False})
    def parse (a):
        return a

engine = "${params.engine}"

# initialization

from optimus import Optimus
${opInit}

res.update({"use_client": True if getattr(op, 'remote_run', None) else False });

client = getattr(op, 'client', None)
dashboard_link = getattr(client, 'dashboard_link', None) if client else None
res.update({"dashboard_link": dashboard_link});
res.update({"cluster_name": getattr(op, "cluster_name", None)});
op_engine = getattr(op, 'engine', None)
res.update({'optimus': 'ok init', 'optimus_version': getattr(op, '__version__', None), 'engine': op_engine});
${TIME_END}
${OUTPUT_JSON}
`;
}

export default { init, features, code };

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

const output_json = (res = 'res') => `dump_json(${res}, ensure_ascii=False)`

const INIT_JSON = `
from optimus.helpers.json import dump_json
`

const code = (code = '') => `

${TIME_START}
${code}
res = {'result': _output}
${TIME_END}
${output_json('res')}
`;

const asyncCode = (code = '') => `

${TIME_START}
_output_callback = None
${code}
_result = None
if _output.status == "finished":
    _result = _output.result()
else:
    _output.add_done_callback(_out_result(_output_callback))

res = {'result': _result, 'status': _output.status, 'key': _output.key }
${TIME_END}
${output_json('res')}
`;

const features = (payload) => `

${INIT_JSON}

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

${output_json('res')}
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
${INIT_JSON}

def _out_result(_callback = None):
    def _f(fut):
        _res = {}
        try:
            _res = {'key': fut.key, 'status': fut.status}
            if fut.status == "error":
                _res.update({'error': str(fut.exception())})
            elif fut.status == "finished":
                if _callback:
                    _res.update({'result': _callback(fut)})
                else:
                    _res.update({'result': fut.result()})
        except Exception as callback_error:
            # _res.update({'raw_result': fut.result()})
            _res.update({'error': callback_error})
            _res.update({'status': "error"})


        display(${output_json('_res')})
    return _f

# optimus parser

reset = ${(params?.reset != '0') ? 'True' : 'False'}

try:
    date; datetime;
    assert (not reset)
except Exception:
    reset = True
    from datetime import datetime, date

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
${output_json('res')}
`;
}

export default { init, features, code, asyncCode };

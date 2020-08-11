const codeTraceback = (code = '') => `
_start_time = datetime.utcnow().timestamp()
code = """${code}"""
res = {}
try:
    exec(code, globals())
except Exception as err:
    res.update({'traceback': traceback.format_exc()})
    res.update({'error': str(err)})
res.update({'result': _output})
_end_time = datetime.utcnow().timestamp()
res.update({'_gatewayTime': {'start': _start_time, 'end': _end_time, 'duration': _end_time-_start_time}})
json.dumps(res,  default=_json_default, ensure_ascii=False)
`
const code = (code = '') => `
_start_time = datetime.utcnow().timestamp()
${code}
res = {'result': _output}
_end_time = datetime.utcnow().timestamp()
res.update({'_gatewayTime': {'start': _start_time, 'end': _end_time, 'duration': _end_time-_start_time}})
json.dumps(res,  default=_json_default, ensure_ascii=False)
`

const datasetsMin = (payload = {}) => `
{ _df: globals()[_df].cols.names() for (_df) in ipython_vars(globals(),"dask") }
`

const datasets = (payload = {}) => `
_start_time = datetime.utcnow().timestamp()
_dfs = ipython_vars(globals(),"dask")
_end_time = datetime.utcnow().timestamp()
res = { _df: globals()[_df].cols.names() for (_df) in _dfs }
res.update({'_gatewayTime': {'start': _start_time, 'end': _end_time, 'duration': _end_time-_start_time}})
json.dumps(res,  default=_json_default, ensure_ascii=False)
`

const initMin = (payload = {}) => `
op = Optimus("${payload.engine || 'dask'}",`
+ (payload.address ? ` address="${payload.address}",` : '')
+ ` threads_per_worker=${payload.tpw || 8}, n_workers=${payload.workers || 1}, comm=True)
`

const init = (payload = {}) => `
try:
    json; date; datetime; ipython_vars; _json_default; traceback;
except Exception:
    from datetime import datetime, date
    from optimus.helpers.functions import ipython_vars
    import traceback
    import json
    def _json_default(o):
        if isinstance(o, (date, datetime)):
            return o.isoformat()
_start_time = datetime.utcnow().timestamp()

res = { 'kernel': 'ok' }

reset = ${payload.reset || 'False'}

engine = "${payload.engine || 'dask'}"

n_workers = ${payload.n_workers || 1}
threads_per_worker = ${payload.threads_per_worker || 8}
processes = ${payload.processes || 'False'}
memory_limit = "${payload.memory_limit || '3G'}"

process = ${payload.process || 'True'}

from optimus.expressions import reserved_words, Parser
res.update({'reserved_words': reserved_words})
p = Parser()

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
    op = Optimus(engine`
    + ((payload.address && payload.engine.includes('dask')) ? `, address="${payload.address}",` : '')
    + (payload.engine==='dask' ? `, n_workers=n_workers, threads_per_worker=threads_per_worker, processes=processes memory_limit=memory_limit, comm=True, ` : '')
    + (payload.engine==='dask_cudf' ? `, process=process` : '')
    +`)
    op
    op.__version__
    op.engine
    res.update({'optimus': 'ok init', 'optimus_version': op.__version__, 'engine': op.engine, 'threads_per_worker': tpw, 'workers': workers})

_end_time = datetime.utcnow().timestamp()
res.update({'_gatewayTime': {'start': _start_time, 'end': _end_time, 'duration': _end_time-_start_time}})
json.dumps(res,  default=_json_default, ensure_ascii=False)
`

export default {init, datasets, code, datasetsMin, initMin}

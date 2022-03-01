#{payload.optimusPath}
#{this.initJSON}
#{this.initVariables}

#{this.initPrefect}
#{this.initUtils}
#{this.initFunctions}

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

        #{this.includeVariables}
        display(#{this.outputJSON("_res")})
    return _f

# optimus parser

reset = #{(payload.params ? payload.params.reset != "0" : false) ? "True" : "False"}

try:
    date; datetime;
    assert (not reset)
except Exception:
    reset = True
    from datetime import datetime, date

#{this.measureTime ? this.timeStart : ""}

res = { 'kernel': 'ok' }

try:
    from optimus.expressions import parse
    res.update({'parser_available': True})
except:
    res.update({'parser_available': False})
    def parse (a):
        return a

engine = "#{payload.params.engine}"

# initialization

from optimus import Optimus
#{payload.opInit}

res.update({"use_client": True if getattr(op, 'remote_run', None) else False });

client = getattr(op, 'client', None)
dashboard_link = getattr(client, 'dashboard_link', None) if client else None
res.update({"dashboard_link": dashboard_link});
res.update({"cluster_name": getattr(op, "cluster_name", None)});
op_engine = getattr(op, 'engine', None)
res.update({'optimus': 'ok init', 'optimus_version': getattr(op, '__version__', None), 'engine': op_engine});
#{this.measureTime ? this.timeEnd : ""}
#{this.includeVariables}
#{this.outputJSON("res")}

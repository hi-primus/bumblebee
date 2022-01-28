#{payload.optimusPath}
#{this.initJSON}
#{this.initVariables}

# bumblebee specific methods

def df__preliminary_profile(df, cols="*"):
    import copy
    body = copy.deepcopy(df.meta).get("profile", {})
    body.update({"summary": {
        "rows_count": df.rows.count()
    }})
    types = df.cols.inferred_data_type(cols, use_internal=True)
    data_type = df.cols.data_type(cols)
    body.update({"columns": 
                 {col: {
                    "data_type": data_type[col],
                    "stats": {"inferred_data_type": {"data_type": dtype}}
                 } for col, dtype in types.items()}
                })
    return body


def add_to_table(table, add):
    table = table.add(add, fill_value=0) if table is not None else add
    table["count"] = table["count"].astype("int64")
    return table
    

def output_table(table, limit=None):
    table = table.sort_values(by="count", ascending=False).reset_index()
    if limit is not None:
        table = table[0:limit]
    return {"values": table.to_dict('records')}


def table_to_pandas(table):
    import pandas as pd
    return pd.DataFrame.from_dict(table["values"]).set_index("value")

# utils

def inject_method_to_optimus(func):
    func_name = func.__name__
    _func_split = func_name.split("__")
    
    if len(_func_split) == 3:
        func_type, accessor, method_name = _func_split
    elif len(_func_split) == 2:
        func_type, method_name = _func_split
        accessor = None
    else:
        raise TypeError(f"Wrong name '{func_name}', must have the form 'type__accessor__name'")
       
    from optimus.engines.base.basedataframe import BaseDataFrame
    from optimus.engines.base.columns import BaseColumns
    from optimus.engines.base.rows import BaseRows
    
    from optimus.engines.base.engine import BaseEngine
    from optimus.engines.base.create import BaseCreate
    
    _cls = None
    
    if func_type == "df":
        if accessor == "cols":
            _cls = BaseColumns
        elif accessor == "rows":
            _cls = BaseRows
        else:
            _cls = BaseDataFrame
            
    elif func_type == "op":
        if accessor == "create":
            _cls = BaseCreate
        else:
            _cls = BaseEngine
            
    if _cls is None:
        raise TypeError(f"Wrong name '{func_name}', must have the form 'type__accessor__name'")
            
    if _cls in [BaseDataFrame, BaseEngine]:
        def binded(self, *args, **kwargs):
            _df = self
            return func(_df, *args, **kwargs)
        
    else:
        def binded(self, *args, **kwargs):
            _df = self.root
            return func(_df, *args, **kwargs)
    
    setattr(_cls, method_name, binded)
    return True

inject_method_to_optimus(df__preliminary_profile)

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

cache = {}

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

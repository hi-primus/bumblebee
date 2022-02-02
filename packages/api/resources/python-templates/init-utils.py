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


def set_patterns_meta(df, column_name, result, n=10):
    from optimus.engines.base.meta import Meta
    import time
    more = False
    if not isinstance(result, dict):
        more = len(result) > n
        result = output_table(result, n)
    result.update({"more": more, "updated": time.time()})
    df.meta = Meta.set(df.meta, f"profile.columns.{column_name}.patterns", result)
    return df

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

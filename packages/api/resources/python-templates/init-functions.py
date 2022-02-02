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

  
def df__pattern_counts_cache(df, column_name, n=10, mode=0, sample=None):
    from optimus.engines.base.meta import Meta
    from_meta = False
    patterns = Meta.get(df.meta, f"profile.columns.{column_name}.patterns")

    has_patterns = patterns is not None and (n is None or n <= len(patterns["values"]) or not patterns["more"])

    if has_patterns:
        complete = True
        patterns = df.cols.pattern_counts(column_name, n=None, mode=mode)
    else:
        complete = False
        sample_df = df if sample is None else df[sample[0]:sample[1]]
        patterns = sample_df.cols.pattern_counts(column_name, n=None, mode=mode)
    return {"complete": complete, "patterns": patterns}

def df__pattern_counts_df(df, cols="*", n=10, mode=0, flush=False):
    df.cols.pattern_counts(cols, n=n, mode=mode, flush=flush)
    return df

from optimus.profiler.constants import MAX_BUCKETS

def df__profile_df(df, cols="*", bins: int = MAX_BUCKETS, flush: bool = False):
    df.profile(cols, bins=bins, flush=flush)
    return df

inject_method_to_optimus(df__preliminary_profile)
inject_method_to_optimus(df__pattern_counts_cache)
inject_method_to_optimus(df__pattern_counts_df)
inject_method_to_optimus(df__profile_df)

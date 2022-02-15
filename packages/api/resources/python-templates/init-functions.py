import copy

from optimus.engines.base.meta import Meta
from optimus.profiler.constants import MAX_BUCKETS

def df__preliminary_profile(df, cols="*"):
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

  
def df__pattern_counts_cache(df, cols="*", n=10, mode=0, sample=None, last_sample=False, flush=False, force_cached=False):
    cols = df.cols.names(cols)
    result = {}
    
    cache_key = f"pattern_counts.{mode}"
    
    for column_name in cols:
        
        _cache_key = f"{cache_key}.{column_name}"
        _meta_key = f"profile.columns.{column_name}.patterns"
        
        if force_cached:
            cached = Meta.get(df.cache, _cache_key)
            result.update({column_name: output_table(cached, n)})
            continue
        
        if flush:
            df.cache = Meta.set(df.cache, _cache_key, None)
        
        patterns = Meta.get(df.meta, _meta_key)

        has_patterns = patterns is not None and (n is None or n <= len(patterns["values"]) or not patterns["more"])

        if has_patterns:
            complete = True
            patterns = df.cols.pattern_counts(column_name, n=None, mode=mode)[column_name]["values"]
        else:
            complete = False
            sample_df = df if sample is None else df[sample[0]:sample[1]]
            patterns = sample_df.cols.pattern_counts(column_name, n=None, mode=mode)[column_name]["values"]
        
        if patterns is not None:
            pd_patterns = table_to_pandas(patterns)

            if complete:
                df.cache = Meta.set(df.cache, _cache_key, pd_patterns)
            else:
                cached = Meta.get(df.cache, _cache_key)            
                pd_patterns = add_to_table(cached, pd_patterns)
                df.cache = Meta.set(df.cache, _cache_key, pd_patterns)

            if last_sample:
                df = set_patterns_meta(df, column_name, pd_patterns, n)

            patterns = output_table(pd_patterns, n)
            patterns.update({"complete": complete})
        
            result.update({column_name: patterns})
            
        else:
            result.update({column_name: None})
    
    return one_dict_to_val(result)


def df__profile_stats_cache(df, cols="*", sample=None, last_sample=False, flush=False, force_cached=False) -> [dict, list]:
    """
    Return a dict with the profile stats of the dataframe and a list of the updated cols.
    """
    cols = df.cols.names(cols)
    cache_key = "profile.stats"
    
    meta_key = "profile"
        
    if force_cached:
        return Meta.get(df.cache, cache_key), []

    if flush:
        df.cache = Meta.set(df.cache, cache_key, None)

    cached = Meta.get(df.cache, cache_key) or {}
    already_updated_cols = []

    # avoid profiling already profiled columns

    for col in cached.get("columns", []):
        if cached["columns"][col]["last_sampled_row"] == sample[1]:
            already_updated_cols.append(col)

    profile_cols = [col for col in cols if col not in already_updated_cols]
    
    sample_df = df if sample is None else df[sample[0]:sample[1]]    
    stats = sample_df.profile(profile_cols, bins=0)

    for col in already_updated_cols:
        stats["columns"].update({col: cached["columns"][col]})

    # annotate the profile stats with the last sampled row

    for col in stats.get("columns", []):
        stats["columns"][col]["last_sampled_row"] = sample[1]
   
    stats = add_profile(stats, cached)
    
    # sort columns

    columns_list = df.cols.names()
    stats["columns"] = {col: stats["columns"][col] for col in columns_list if col in stats["columns"]}

    df.cache = Meta.set(df.cache, cache_key, stats)
    
    if last_sample:
        df.meta = Meta.set(df.meta, meta_key, stats)
    
    return stats, profile_cols


def df__profile_frequency_cache(df, cols="*", n=MAX_BUCKETS, sample=None, last_sample=False, flush=False, force_cached=False):
    cols = df.cols.names(cols)
    result = {}
    
    cached_freqs = Meta.get(df.cache, "frequency") or {}
    
    for column_name in cached_freqs:
        pd_frequency = cached_freqs[column_name]
        frequency = output_table(pd_frequency, n)
        frequency.update({"count_uniques": len(pd_frequency)})
        frequency.update({"complete": False})
        result.update({column_name: frequency})    
        
    cols = cols or {}
    
    for column_name in cols:
        
        _cache_key = f"frequency.{column_name}"
        _meta_key = f"profile.columns.{column_name}.stats.frequency"
        
        if force_cached:
            cached = Meta.get(df.cache, _cache_key)
            result.update({column_name: output_table(cached, n)})
            continue
        
        if flush:
            df.cache = Meta.set(df.cache, _cache_key, None)
        
        frequency = Meta.get(df.meta, _meta_key)

        has_freq = frequency is not None and (n is None or n <= len(frequency["values"]) or not frequency.get("more"))

        if has_freq:
            complete = True
            _result = df.cols.frequency(column_name, n=None)["frequency"][column_name]
        else:
            complete = False
            sample_df = df if sample is None else df[sample[0]:sample[1]]
            _result = sample_df.cols.frequency(column_name, n=None)["frequency"][column_name]
        
        frequency = _result["values"] if "values" in _result else None
        
        if frequency is not None:
            pd_frequency = table_to_pandas(frequency)

            if complete:
                df.cache = Meta.set(df.cache, _cache_key, pd_frequency)
            else:
                cached = Meta.get(df.cache, _cache_key)            
                pd_frequency = add_to_table(cached, pd_frequency)
                df.cache = Meta.set(df.cache, _cache_key, pd_frequency)

            frequency = output_table(pd_frequency, n)
            frequency.update({"count_uniques": len(pd_frequency)})
                
            if last_sample:
                df.meta = Meta.set(df.meta, _meta_key, copy.deepcopy(frequency))
            
            frequency.update({"complete": complete})
            result.update({column_name: frequency})
            
        else:
            result.update({column_name: None})
    
    return result # one_dict_to_val(result)


def df__profile_hist_cache(df, cols="*", buckets=MAX_BUCKETS, sample=None, last_sample=False, flush=False, force_cached=False):
    cols = df.cols.names(cols)
    result = {}
    
    cached_hists = Meta.get(df.cache, f"hist.{buckets}") or {}
    
    for column_name in cached_hists:
        result.update({column_name: output_hist(cached_hists[column_name], buckets)})
        
    cols = cols or {}
    
    for column_name in cols:
        
        _cache_key = f"hist.{buckets}.{column_name}"
        _min_cache_key = f"min.{column_name}"
        _max_cache_key = f"max.{column_name}"
        _meta_key = f"profile.columns.{column_name}.stats.hist"
        
        if force_cached:
            cached = Meta.get(df.cache, _cache_key)
            result.update({column_name: output_table(cached, buckets)})
            continue
            
        _min = Meta.get(df.cache, _min_cache_key)
        _max = Meta.get(df.cache, _max_cache_key)
        
        if _min is None:
            _min = df.cols.min(column_name)
            df.cache = Meta.set(df.cache, _min_cache_key, _min)
            
        if _max is None:
            _max = df.cols.max(column_name)
            df.cache = Meta.set(df.cache, _max_cache_key, _max)
            
        _range = (_min, _max)
        
        if flush:
            df.cache = Meta.set(df.cache, _cache_key, None)
        
        hist = Meta.get(df.meta, _meta_key)

        has_hist = hist is not None and (buckets is None or buckets != len(hist))

        if has_hist:
            complete = True
            hist = df.cols.hist(column_name, buckets=buckets, range=_range)["hist"][column_name]
        else:
            complete = False
            sample_df = df if sample is None else df[sample[0]:sample[1]]
            hist = sample_df.cols.hist(column_name, buckets=buckets, range=_range)["hist"][column_name]
        
        if hist is not None:
            pd_hist = hist_to_pandas(hist)

            if complete:
                df.cache = Meta.set(df.cache, _cache_key, pd_hist)
            else:
                cached = Meta.get(df.cache, _cache_key)            
                pd_hist = add_to_table(cached, pd_hist)
                df.cache = Meta.set(df.cache, _cache_key, pd_hist)

            hist = output_hist(pd_hist, buckets)
                
            if last_sample:
                df.meta = Meta.set(df.meta, _meta_key, hist)
            
            result.update({column_name: hist})
            
        else:
            result.update({column_name: None})
    
    return result # one_dict_to_val(result)



def df__profile_cache(df, cols="*", bins: int = MAX_BUCKETS, sample=None, last_sample=False, flush=False, force_cached=False):
    
    cols = df.cols.names(cols)
    print("cols")
    print(cols)
    stats, cols = df.profile_stats_cache(cols, sample, last_sample, flush, force_cached)
    print(cols)
    
    hist_cols = [col for col in cols if df.cols.data_type(col) in df.constants.NUMERIC_INTERNAL_TYPES]
    freq_cols = [col for col in cols if col not in hist_cols]
    
    freqs = df.profile_frequency_cache(freq_cols, n=bins, sample=sample, last_sample=last_sample, flush=flush, force_cached=force_cached)
    hists = df.profile_hist_cache(hist_cols, buckets=bins, sample=sample, last_sample=last_sample, flush=flush, force_cached=force_cached)
    
    if freqs:
        for key in freqs:
            if key in stats["columns"]:
                stats["columns"][key].update({"frequency": freqs[key]})
            
    if hists:
        for key in hists:
            if key in stats["columns"]:
                stats["columns"][key].update({"hist": hists[key]})

    if last_sample:
        for key in cols:
            if key in stats["columns"]:
                stats["columns"][key].update({"done": True})
    
    return stats


def df__pattern_counts_df(df, cols="*", n=10, mode=0, flush=False):
    df.cols.pattern_counts(cols, n=n, mode=mode, flush=flush)
    return df


def df__profile_df(df, cols="*", bins: int = MAX_BUCKETS, flush: bool = False):
    df.profile(cols, bins=bins, flush=flush)
    return df


inject_method_to_optimus(df__preliminary_profile)
inject_method_to_optimus(df__pattern_counts_cache)
inject_method_to_optimus(df__profile_stats_cache)
inject_method_to_optimus(df__profile_hist_cache)
inject_method_to_optimus(df__profile_frequency_cache)
inject_method_to_optimus(df__profile_cache)
inject_method_to_optimus(df__pattern_counts_df)
inject_method_to_optimus(df__profile_df)

import copy

import glom
from glom import Path

from optimus.engines.base.meta import Meta
from optimus.profiler.constants import MAX_BUCKETS

MAX_SAMPLE_SIZE = 10000

def df__preliminary_profile(df, cols="*"):
    body = copy.deepcopy(df.meta).get("profile", {})
    cols_count = df.cols.count()
    rows_count = df.rows.count()
    body.update({"summary": {
        "cols_count": cols_count,
        "rows_count": rows_count
    }})

    count_uniques = {}

    if rows_count > MAX_SAMPLE_SIZE:
        count_uniques = df.sample(MAX_SAMPLE_SIZE).cols.count_uniques(cols, tidy=False)["count_uniques"]
    else:
        count_uniques = df.cols.count_uniques(cols, tidy=False)["count_uniques"]

    data_type = df.cols.data_type(cols, tidy=False)["data_type"]

    plot_type = {}

    for col in count_uniques:
        _count_uniques = count_uniques[col]

        if isinstance(_count_uniques, list):
            _count_uniques = _count_uniques[0]

        if ((data_type[col] in df.constants.INT_INTERNAL_TYPES and _count_uniques > 80) or
            (data_type[col] in df.constants.FLOAT_INTERNAL_TYPES and _count_uniques > 1)):
            plot_type[col] = "hist"
        elif _count_uniques > 2000:
            plot_type[col] = "complete"
        else:
            plot_type[col] = "freq"

        df.meta = Meta.set(df.meta, Path("plot_type", col), plot_type[col])

    types = df.cols.inferred_data_type(cols, use_internal=True, tidy=False)["inferred_data_type"]

    body.update({"name": df.meta.get("name")})
    body.update({"file_name": df.meta.get("file_name")})

    body.update({"columns": 
                 {col: {
                    "plot_type": plot_type[col],
                    "data_type": data_type[col],
                    "stats": {"inferred_data_type": {"data_type": dtype}}
                 } for col, dtype in types.items()}
                })
    return body

  
def df__pattern_counts_cache(df, cols="*", n=10, mode=0, sample=None, last_sample=False, flush=False, force_cached=False):
    cols = df.cols.names(cols)
    result = {}
    
    cache_key = ["pattern_counts", mode]
    
    for column_name in cols:
        
        _cache_key = cache_key + [column_name]
        _meta_key = ["profile", "columns", column_name, "patterns"]
        
        if force_cached:
            cached = glom.glom(df.cache, Path(*_cache_key), default=None)
            result.update({column_name: output_table(cached, n)})
            continue
        
        if flush:
            df.cache = glom.assign(df.cache, Path(*_cache_key), None, missing=dict)
        
        patterns = Meta.get(df.meta, Path(*_meta_key))

        has_patterns = patterns is not None and (n is None or n <= len(patterns["values"]) or not patterns["more"])

        if has_patterns:
            complete = True
            patterns = df.cols.pattern_counts(column_name, n=None, mode=mode)[column_name]["values"]
        else:
            complete = False
            sample_df = df if sample is None else df.iloc(lower_bound=sample[0], upper_bound=sample[1], copy=False)
            patterns = sample_df.cols.pattern_counts(column_name, n=None, mode=mode)[column_name]["values"]
        
        if patterns is not None and len(patterns):
            pd_patterns = table_to_pandas(patterns)

            if complete:
                df.cache = glom.assign(df.cache, Path(*_cache_key), pd_patterns, missing=dict)
            else:
                cached = glom.glom(df.cache, Path(*_cache_key), default=None)            
                pd_patterns = add_to_table(cached, pd_patterns)
                df.cache = glom.assign(df.cache, Path(*_cache_key), pd_patterns, missing=dict)

            if last_sample:
                df.meta = set_patterns_meta(df.meta, column_name, pd_patterns, n)

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
    cache_key = ["profile", "stats"]
    
    meta_key = ["profile"]
        
    if force_cached:
        return glom.glom(df.cache, Path(*cache_key), default=None), []

    if flush:
        df.cache = glom.assign(df.cache, Path(*cache_key), None, missing=dict)

    cached = glom.glom(df.cache, Path(*cache_key), default=None) or {}
    already_updated_cols = []
    needs_update_cols = []

    # avoid profiling already profiled columns

    for col in cached.get("columns", []):
        if cached["columns"][col]["last_sampled_row"] >= sample[1] or cached["columns"][col]["last_sampled_row"] == -1:
            already_updated_cols.append(col)
        elif cached["columns"][col]["last_sampled_row"] != sample[0]:
            needs_update_cols.append(col)

    profile_cols = [col for col in cols if col not in already_updated_cols + needs_update_cols]
    
    sample_df = df if sample is None else df.iloc(lower_bound=sample[0], upper_bound=sample[1], copy=False)

    complete_stats_cols = Meta.get(df.meta, "profile.columns") or {}

    complete_stats_cols = {col: stats for col, stats in complete_stats_cols.items() if stats.get("last_sampled_row", -1) == -1}

    if len(complete_stats_cols):
        profile_cols = [col for col in profile_cols if col not in complete_stats_cols]

    stats = sample_df.profile(profile_cols, bins=0)

    for col in already_updated_cols:
        stats["columns"].update({col: cached["columns"][col]})

    # annotate the profile stats with the last sampled row

    for col in stats.get("columns", []):
        stats["columns"][col]["last_sampled_row"] = sample[1]

    for col in needs_update_cols:
        stats["columns"].update({col: cached["columns"][col]})
        stats["columns"][col]["needs_previous_range"] = True
   
    stats = add_profile(stats, cached)

    for col in complete_stats_cols:
        complete_stats_cols[col]["last_sampled_row"] = -1
    
    stats["columns"].update(complete_stats_cols)
    
    # sort columns

    columns_list = df.cols.names()
    stats["columns"] = {col: stats["columns"][col] for col in columns_list if col in stats["columns"]}

    df.cache = glom.assign(df.cache, Path(*cache_key), stats, missing=dict)

    if last_sample:
        meta_keys = [["summary", "data_types_list"], ["summary", "total_count_data_types"]]
        col_meta_keys = [["stats", "match"], ["stats", "missing"], ["stats", "mismatch"], ["stats", "inferred_data_type"], ["data_type"]]
        
        for _m in meta_keys:
            _v = glom.glom(stats, Path(*_m), default=None)
            if _v is not None:
                path = meta_key + _m
                df.meta = Meta.set(df.meta, Path(*path), _v)

        for col in cols:
            for _m in col_meta_keys:
                path = ["columns", col] + _m
                _v = glom.glom(stats, Path(*path), default=None)
                if _v is not None:
                    path = meta_key + ["columns", col] + _m
                    df.meta = Meta.set(df.meta, Path(*path), _v)

        # df.meta = Meta.set(df.meta, meta_key, stats)
    
    return stats, profile_cols


def df__profile_frequency_cache(df, cols="*", n=MAX_BUCKETS, sample=None, last_sample=False, flush=False, force_cached=False):
    cols = df.cols.names(cols)
    result = {}
    
    cached_freqs = glom.glom(df.cache, "frequency", default=None) or {}
    
    for column_name in cached_freqs:
        pd_frequency = cached_freqs[column_name]
        frequency = output_table(pd_frequency, n)
        frequency.update({"count_uniques": len(pd_frequency)})
        frequency.update({"complete": False})
        result.update({column_name: frequency})    
        
    cols = cols or {}
    
    for column_name in cols:
        
        _cache_key = ["frequency", column_name]
        _meta_key = ["profile", "columns", column_name, "stats"]
        
        if force_cached:
            cached = glom.glom(df.cache, Path(*_cache_key), default=None)
            result.update({column_name: output_table(cached, n)})
            continue
        
        if flush:
            df.cache = glom.assign(df.cache, Path(*_cache_key), None, missing=dict)
        
        stats = Meta.get(df.meta, Path(*_meta_key))

        has_freq = stats is not None and "frequency" in stats and (n is None or n <= len(stats["frequency"]) or not stats.get("more"))

        if has_freq:
            complete = True
            _result = { "values": stats["frequency"], "count_uniques": stats["count_uniques"] }
        else:
            complete = False
            sample_df = df if sample is None else df.iloc(lower_bound=sample[0], upper_bound=sample[1], copy=False)
            _result = sample_df.cols.frequency(column_name, n=None)["frequency"][column_name]
        
        frequency = _result["values"] if "values" in _result else None
        
        if frequency is not None and len(frequency):
            pd_frequency = table_to_pandas(frequency)

            if complete:
                df.cache = glom.assign(df.cache, Path(*_cache_key), pd_frequency, missing=dict)
            else:
                cached = glom.glom(df.cache, Path(*_cache_key), default=None)            
                pd_frequency = add_to_table(cached, pd_frequency)
                df.cache = glom.assign(df.cache, Path(*_cache_key), pd_frequency, missing=dict)

            frequency = output_table(pd_frequency, n)
            frequency.update({"count_uniques": len(pd_frequency)})
                
            if last_sample:
                cf = copy.deepcopy(frequency)
                df.meta = Meta.set(df.meta, Path(*_meta_key, "frequency"), cf["values"])
                df.meta = Meta.set(df.meta, Path(*_meta_key, "count_uniques"), cf["count_uniques"])
            
            frequency.update({"complete": complete})
            result.update({column_name: frequency})
            
        else:
            result.update({column_name: None})
    
    return result # one_dict_to_val(result)


def df__profile_hist_cache(df, cols="*", buckets=MAX_BUCKETS, sample=None, last_sample=False, flush=False, force_cached=False):
    cols = df.cols.names(cols)
    result = {}
    
    cached_hists = glom.glom(df.cache, Path("hist", buckets), default=None) or {}
    
    for column_name in cached_hists:
        result.update({column_name: output_hist(cached_hists[column_name], buckets)})
        
    cols = cols or {}
    
    for column_name in cols:
        
        _cache_key = ["hist", buckets, column_name]
        _min_cache_key = ["min" , column_name]
        _max_cache_key = ["max" , column_name]
        _meta_key = ["profile", "columns", column_name, "stats", "hist"]
        
        if force_cached:
            cached = glom.glom(df.cache, Path(*_cache_key), default=None)
            result.update({column_name: output_table(cached, buckets)})
            continue
            
        _min = glom.glom(df.cache, Path(*_min_cache_key), default=None)
        _max = glom.glom(df.cache, Path(*_max_cache_key), default=None)
        
        if _min is None:
            _min = df.cols.min(column_name)
            df.cache = glom.assign(df.cache, Path(*_min_cache_key), _min, missing=dict)
            
        if _max is None:
            _max = df.cols.max(column_name)
            df.cache = glom.assign(df.cache, Path(*_max_cache_key), _max, missing=dict)
            
        _range = (_min, _max)
        
        if flush:
            df.cache = glom.assign(df.cache, Path(*_cache_key), None, missing=dict)
        
        hist = Meta.get(df.meta, Path(*_meta_key))

        has_hist = hist is not None and (buckets is None or buckets != len(hist))

        if has_hist:
            complete = True
            hist = df.cols.hist(column_name, buckets=buckets, range=_range)["hist"][column_name]
        else:
            complete = False
            sample_df = df if sample is None else df.iloc(lower_bound=sample[0], upper_bound=sample[1], copy=False)
            hist = sample_df.cols.hist(column_name, buckets=buckets, range=_range)["hist"][column_name]
        
        if hist is not None:
            pd_hist = hist_to_pandas(hist)

            if complete:
                df.cache = glom.assign(df.cache, Path(*_cache_key), pd_hist, missing=dict)
            else:
                cached = glom.glom(df.cache, Path(*_cache_key), default=None)            
                pd_hist = add_to_table(cached, pd_hist)
                df.cache = glom.assign(df.cache, Path(*_cache_key), pd_hist, missing=dict)

            hist = output_hist(pd_hist, buckets)
                
            if last_sample:
                df.meta = Meta.set(df.meta, Path(*_meta_key), hist)
            
            result.update({column_name: hist})
            
        else:
            result.update({column_name: None})
    
    return result # one_dict_to_val(result)


def df__profile_cache(df, cols="*", bins: int = MAX_BUCKETS, sample=None, last_sample=False, flush=False, force_cached=False):
    
    cols = df.cols.names(cols)

    if cols is None:
        return None

    if "plot_type" not in df.meta:
        df.preliminary_profile()

    plot_type = Meta.get(df.meta, "plot_type") or {}

    hist_cols = [col for col in cols if plot_type.get(col) == "hist"]
    freq_cols = [col for col in cols if plot_type.get(col) == "freq"]
    complete_stats_cols = [col for col in cols if plot_type.get(col) == "complete"]
    
    complete_stats_profile = df.profile(complete_stats_cols, bins=bins) if complete_stats_cols and len(complete_stats_cols) > 0 else {}

    if flush:
        df.cache = glom.assign(df.cache, "profile", {}, missing=dict)
        df.cache = glom.assign(df.cache, "frequency", {}, missing=dict)
        df.cache = glom.assign(df.cache, "hist", {}, missing=dict)
        df.cache = glom.assign(df.cache, "min", {}, missing=dict)
        df.cache = glom.assign(df.cache, "max", {}, missing=dict)

        columns = Meta.get(df.meta, "profile.columns") or {}
        to_flush = df._cols_to_profile("*")
        
        columns = {col: value for col, value in columns.items() if col not in to_flush}
        
        df.meta = Meta.set(df.meta, "profile.columns", columns)

    stats, cols = df.profile_stats_cache(cols, sample=sample, last_sample=last_sample, flush=False, force_cached=force_cached)
    
    hists = df.profile_hist_cache(hist_cols, buckets=bins, sample=sample, last_sample=last_sample, flush=False, force_cached=force_cached)
    freqs = df.profile_frequency_cache(freq_cols, n=bins, sample=sample, last_sample=last_sample, flush=False, force_cached=force_cached)

    complete_stats = {col: {"values": Meta.get(complete_stats_profile, Path("columns", col, "stats", "frequency"))} for col in complete_stats_cols}

    freqs.update(complete_stats)
    
    if freqs:
        for key in freqs:
            if key in stats["columns"]:
                if "stats" not in stats["columns"][key]:
                    stats["columns"][key].update({"stats": {}})
                stats["columns"][key]["stats"].update({"frequency": freqs[key]})
                if key in complete_stats:
                    stats["columns"][key].update({"done": True})
            
    if hists:
        for key in hists:
            if key in stats["columns"]:
                if "stats" not in stats["columns"][key]:
                    stats["columns"][key].update({"stats": {}})
                stats["columns"][key]["stats"].update({"hist": hists[key]})
                if key in complete_stats:
                    stats["columns"][key].update({"done": True})

    if last_sample:
        for key in cols:
            if key in stats["columns"]:
                stats["columns"][key].update({"done": True})

    # TODO: return only the columns that are requested (and combine them in the frontend)
    # stats["columns"] = {key: value for key, value in stats["columns"].items() if key in cols}

    stats.update({"name": df.meta.get("name")})
    stats.update({"file_name": df.meta.get("file_name")})
    stats.update({"cols_count": df.cols.count()})
    
    return stats


def df__pattern_counts_df(df, cols="*", n=10, mode=0, flush=False):
    df.cols.pattern_counts(cols, n=n, mode=mode, flush=flush)
    return df


def df__profile_df(df, cols="*", bins: int = MAX_BUCKETS, flush: bool = False):
    df.profile(cols, bins=bins, flush=flush)
    return df


def df__deck_map(df, cols="*", text=None, iframe_height=295):
    """
    Get a map from a dataframe.
    :param df: Optimus dataframe
    :param cols: column or columns with latitude and longitude for each object and an optional extra column with the alpha value
    :param text: text for each object
    """
    cols = df.cols.names(cols)
    cols_types = {}
    for col in cols:
        col_type = df.cols.inferred_data_type(col) or df.cols.inferred_data_type(col, use_internal=True)
        cols_types.update({col: col_type})

    if len(cols) == 1:
        position = cols
        alpha = None
    elif len(cols) > 2:
        position = cols[:2]
        alpha = cols[2]
    elif len(cols) == 2:
        if cols_types[cols[0]] == "float" and cols_types[cols[1]] == "float":
            position = cols
            alpha = None
        else:
            position = cols[:1]
            alpha = cols[1]

    if len(position) == 1:
        position = position[0]

        if cols_types[position] == "str":
            df_geo = df.cols.strip(position, "[] ")
            df_geo = df_geo.cols.unnest(position, ",", output_cols=[position+"_X", position+"_Y"])
            df_geo = df_geo.cols.to_float([position+"_X", position+"_Y"])
            position = [position+"_X", position+"_Y"]
        
        else: # elif cols_types[position] == "array":
            def split_coordinates(row):
                row[position+"_X"] = row[position][0]
                row[position+"_Y"] = row[position][1]
                return row

            df_geo = df.rows.apply(split_coordinates, mode="map")
            position = [position+"_X", position+"_Y"]
    else:
        df_geo = df.cols.to_float(position)

    color = [48, 158, 227]

    if alpha is not None:
        if df_geo.cols.data_type(alpha, names=True) == "bool":
            df_geo = df_geo.cols.set('alpha', value_func=255, where=df_geo[alpha], default=102)
        else:
            df_geo['alpha'] = 102 + (df_geo[alpha] * (255 - 102) / df_geo.cols.max(alpha)).cols.to_integer()
        
        color = "[48, 158, 227, +alpha]"

    import pydeck as pdk

    # Define a layer to display on a map
    layer = pdk.Layer(
        "ScatterplotLayer",
        df_geo.data,
        pickable=True,
        opacity=0.75,
        stroked=True,
        filled=True,
        radius_scale=20,
        radius_min_pixels=4,
        radius_max_pixels=16,
        line_width_scale=0,
        get_position=position,
        get_radius=6,
        get_fill_color=color,
        get_line_color=color
    )


    # Set the viewport location
    _min = df_geo.cols.min(position)
    _max = df_geo.cols.max(position)

    x_distance = _max[position[0]] - _min[position[0]]
    y_distance = _max[position[1]] - _min[position[1]]
    x_mid = (_max[position[0]] + _min[position[0]]) / 2
    y_mid = (_max[position[1]] + _min[position[1]]) / 2

    distance = max(x_distance, y_distance)
    zoom = 5.5*max(0.01, distance-0.18)**-0.41
    zoom -= abs(y_mid) ** 3 / 250000
    zoom = max(min(zoom, 12), -2)

    view_state = pdk.ViewState(latitude=y_mid, longitude=x_mid, zoom=zoom, bearing=0, pitch=0)

    # Render
    r = pdk.Deck(
        layers=[layer],
        initial_view_state=view_state,
        map_style=pdk.map_styles.LIGHT,
        height=295,
        **({"tooltip": {"text": text}} if text else {})
    )

    return r.to_html(iframe_height=iframe_height).data

inject_method_to_optimus(df__preliminary_profile)
inject_method_to_optimus(df__pattern_counts_cache)
inject_method_to_optimus(df__profile_stats_cache)
inject_method_to_optimus(df__profile_hist_cache)
inject_method_to_optimus(df__profile_frequency_cache)
inject_method_to_optimus(df__profile_cache)
inject_method_to_optimus(df__pattern_counts_df)
inject_method_to_optimus(df__profile_df)
inject_method_to_optimus(df__deck_map)

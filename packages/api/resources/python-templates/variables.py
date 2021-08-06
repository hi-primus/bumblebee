from optimus.helpers.functions import list_engines, list_dataframes, list_clusters, list_connections
def optimus_variables():
    return { "engines": list_engines(), "dataframes": list_dataframes(), "clusters": list_clusters(), "connections": list_connections() }
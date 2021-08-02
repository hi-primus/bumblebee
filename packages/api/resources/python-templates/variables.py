from optimus.helpers.functions import engines, dataframes, clusters, connections
def optimus_variables():
    return { "engines": engines(), "dataframes": dataframes(), "clusters": clusters(), "connections": connections() }
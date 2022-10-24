// TODO: should we use an array instead and search using regex (to handle aliases)?

export const operations: Record<string, Operation> = {
  count: {
    sourceType: 'dataframe',
    name: 'count',
    callback: function (server: Server, kwargs: { source: string }) {
      // return `${kwargs.source}.cols.count()`
      // columns = await runScript(`list(${kwargs.source}.columns)`);
      return server.run(`len("${kwargs.source}")`);
      // return server.run(`${kwargs.source}.count().execute()`);
    },
  },
  columns: {
    sourceType: 'dataframe',
    name: 'columns|cols',
    // TODO: make this work
    initialization: function (server: Server) {
      return server.run(`
def cols(df):
    return list(df.columns)
`);
    },
    callback: function (server: Server, kwargs: { source: string }) {
      return server.run(`cols(${kwargs.source})`);
      // return server.run(`list(${kwargs.source}.columns)`);
    },
  },
};

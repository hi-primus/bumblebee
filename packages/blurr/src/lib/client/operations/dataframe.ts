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
    initialization: function (server: Server) {
      return server.run(`
        def cols(df):
          return list(df.columns)
        `);
    },
    callback: function (server: Server, kwargs: { source: string }) {
      return server.run(`cols(${kwargs.source})`);
    },
  },
  get_sample: {
    sourceType: 'dataframe',
    name: 'get_sample',
    initialization: function (server: Server) {
      return server.run(`
        def get_sample(df, start = 0, stop = 10):
          return list(df[start: stop])
        `);
    },
    callback: function (
      server: Server,
      kwargs: { source: string; start: number; stop: number }
    ) {
      return server.run(
        `get_sample(${kwargs.source}, ${kwargs.start}), ${kwargs.stop})`
      );
    },
  },
  load_from_file: {
    sourceType: 'none',
    name: 'load_from_file',
    initialization: function (server: Server) {
      return server.run(`
        import ibis
        import pandas as pd

        async def file_from_js(file, path):
          js_buffer = await file.arrayBuffer()
          py_buffer = js_buffer.to_py()
          stream = py_buffer.tobytes()
          with open(path, "wb") as fh:
            fh.write(stream)
          table_name = path.split("/")[-1].split(".")[0]
          conn = ibis.pandas.connect({table_name: pd.read_csv(file_name)})
          return conn.table(table_name)
      `);
    },
    callback: function (server: Server, kwargs: { file: File; path: string }) {
      return server.run(`file_from_js(${kwargs.file}, ${kwargs.path})`);
    },
  },
  load_from_url: {
    sourceType: 'none',
    name: 'load_from_url',
    initialization: function (server: Server) {
      return server.run(`
        import ibis
        import pandas as pd
        from js import fetch

        async def file_from_url(file, path):
          original_file_name = url.split("/")[-1]
          path = path if path else f"/{original_file_name}"
          response = await fetch(url)
          js_buffer = await response.arrayBuffer()
          table_name = path.split("/")[-1].split(".")[0]
          conn = ibis.pandas.connect({table_name: pd.read_csv(file_name)})
          return conn.table(table_name)
      `);
    },
    callback: function (server: Server, kwargs: { url: string; path: string }) {
      return server.run(`file_from_url(${kwargs.url}, ${kwargs.path})`);
    },
  },
};

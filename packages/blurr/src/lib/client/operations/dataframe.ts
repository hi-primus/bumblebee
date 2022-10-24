// TODO: should we use an array instead and search using regex (to handle aliases)?

import { Operation } from '.';

export const operations = {
  count: Operation({
    sourceType: 'dataframe',
    name: 'count',
    callback: function (server: Server, kwargs: { source: string }) {
      // return `${kwargs.source}.cols.count()`
      // columns = await runScript(`list(${kwargs.source}.columns)`);
      // return server.run(`len("${kwargs.source}")`);
      return server.run(`${kwargs.source}.count().execute()`);
    },
  }),
  columns: Operation({
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
  }),
  get_sample: Operation({
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
  }),
  readCsv: Operation({
    sourceType: 'none',
    targetType: 'dataframe',
    name: 'readCsv',
    initialization: function (server: Server) {
      return server.run(`
        import ibis
        import pandas as pd

        from js import fetch

        async def file_from_url(url, path=None):
            original_file_name = url.split("/")[-1]
            path = path if path else f"/{original_file_name}"
            file = await fetch(url)
        
            return await file_from_js(file, path)
        
        
        async def file_from_js(file, path):
            js_buffer = await file.arrayBuffer()
            py_buffer = js_buffer.to_py()  # this is a memoryview
            stream = py_buffer.tobytes()   # now we have a bytes object
            with open(path, "wb") as fh:
                fh.write(stream)
            return path
        
        
        async def load_and_connect_csv(url_or_file):
            if isinstance(url_or_file, str):
                file_name = await file_from_url(url_or_file)
            else:
                file_name = await file_from_js(url_or_file, "local_file") # TODO get name from file
            table_name = file_name.split("/")[-1].split(".")[0]
            conn = ibis.pandas.connect({table_name: pd.read_csv(file_name)})
            return conn.table(table_name)
      `);
    },
    callback: function (
      server: Server,
      kwargs: { target: string; url: string }
    ) {
      // TODO: support file
      return server.run(
        `${kwargs.target} = await load_and_connect_csv('${kwargs.url}')`
      );
    },
  }),
};

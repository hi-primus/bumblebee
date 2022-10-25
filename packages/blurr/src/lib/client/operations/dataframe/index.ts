// TODO: should we use an array instead and search using regex (to handle aliases)?

import { BlurrOperation } from '../factory';

export const operations = {
  count: BlurrOperation({
    sourceType: 'dataframe',
    name: 'count',
    run: function (client: RunsCode, kwargs: { source: string }) {
      return client.run(`${kwargs.source}.count().execute()`);
    },
  }),
  columns: BlurrOperation({
    sourceType: 'dataframe',
    name: 'columns|cols',
    initialize: function (client: RunsCode) {
      return client.run(`
        def cols(df):
          return list(df.columns)
        `);
    },
    run: function (client: RunsCode, kwargs: { source: string }) {
      return client.run(`cols(${kwargs.source})`);
    },
  }),
  get_sample: BlurrOperation<OperationCompatible>({
    sourceType: 'dataframe',
    name: 'get_sample',
    initialize: function (client: RunsCode) {
      return client.run(`
        def get_sample(df, start = 0, stop = 10):
          return list(df[start: stop])
        `);
    },
    run: function (
      client: RunsCode,
      kwargs: { source: string; start: number; stop: number }
    ) {
      return client.run(
        `get_sample(${kwargs.source}, ${kwargs.start}), ${kwargs.stop})`
      );
    },
  }),
  readCsv: BlurrOperation<Source>({
    sourceType: 'none',
    targetType: 'dataframe',
    name: 'readCsv',
    initialize: function (client: RunsCode) {
      return client.run(`
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
    run: function (client: RunsCode, kwargs: { target: string; url: string }) {
      // TODO: support file
      return client.run(
        `${kwargs.target} = await load_and_connect_csv('${kwargs.url}')`
      );
    },
  }),
};

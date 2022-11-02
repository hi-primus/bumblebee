import { RunsCode } from '../../../../types/server';
import { Source } from '../../../../types/source';
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
  columnsSample: BlurrOperation<OperationCompatible>({
    sourceType: 'dataframe',
    name: 'columnsSample',
    getCode: function (kwargs: {
      source: string;
      start: number;
      stop: number;
    }) {
      return (
        `list(${kwargs.source}[${kwargs.start || 0}: ${kwargs.stop || 10}]` +
        `.execute().to_dict(orient="records"))`
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
            js_buffer = await file.arrayBuffer()
            return await file_from_js(js_buffer, path)
        
        
        async def file_from_js(js_buffer, path):
            py_buffer = js_buffer.to_py()  # this is a memoryview
            stream = py_buffer.tobytes()   # now we have a bytes object
            with open(path, "wb") as fh:
                fh.write(stream)
            return path
        
        
        async def load_and_connect_csv(url_or_buffer):
            if isinstance(url_or_buffer, str):
                file_name = await file_from_url(url_or_buffer)
            else:
                file_name = await file_from_js(url_or_buffer, "local_file") # TODO get name from file
            table_name = file_name.split("/")[-1].split(".")[0]
            conn = ibis.pandas.connect({table_name: pd.read_csv(file_name)})
            return conn.table(table_name)
      `);
    },
    run: function (
      client: RunsCode,
      kwargs: { target: string; url: string; file: string }
    ) {
      // TODO: support file
      const args = kwargs.url ? `'${kwargs.url}'` : kwargs.file;
      return client.run(
        `${kwargs.target} = await load_and_connect_csv(${args})`
      );
    },
  }),
};

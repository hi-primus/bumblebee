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


def get_window(table, start=0, stop=10):
    return list(table[start: stop].execute().to_dict(orient="records"))
#{this.measureTime ? this.timeStart : ""}
_output_callback = None
_output = None
res = {}
#{payload}
_result = None

name = _output.__name__ if hasattr(_output, "__name__") else _output.__class__.__name__ if hasattr(_output, "__class__") else "unknown"

if 'Future' in name and callable(_output_callback):

    if _output.status == "finished":
        _result = _output_callback(_output)
    else:
        _output.add_done_callback(_out_result(_output_callback))

    res.update({'result': _result, 'async': True, 'status': _output.status, 'key': _output.key })

else:

    async_error = ""

    if not callable(_output_callback):
        async_error += " _output_callback is not callable."
    
    if 'Future' not in name:
        async_error += f" _output is not a Future, received '{str(type(_output))}' instead."

    res.update({'result': _output, 'async': False, 'async_error':  async_error})
    
#{this.measureTime ? this.timeEnd : ""}
#{this.includeVariables}
#{this.outputJSON("res")}
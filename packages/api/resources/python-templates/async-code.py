#{this.measureTime ? this.timeStart : ""}
_output_callback = None
#{payload}
_result = None
if _output.status == "finished":
    _result = _output_callback(_output)
else:
    _output.add_done_callback(_out_result(_output_callback))

res = {'result': _result, 'status': _output.status, 'key': _output.key }
#{this.measureTime ? this.timeEnd : ""}
#{this.includeVariables}
#{this.outputJSON("res")}
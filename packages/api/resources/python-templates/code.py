#{this.measureTime ? this.timeStart : ""}
_output = None
res = {}
#{payload}
res.update({'result': _output})
#{this.measureTime ? this.timeEnd : ""}
#{this.includeVariables}
#{this.outputJSON("res")}
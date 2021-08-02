#{this.measureTime ? this.timeStart : ""}
#{payload}
res = {'result': _output}
#{this.measureTime ? this.timeEnd : ""}
#{this.includeVariables}
#{this.outputJSON("res")}
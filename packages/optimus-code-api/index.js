exports.version = function() {
  console.log("Code api 0.0.1")
}

const codeGenerators = {
  'apply sort': (payload) => {
    return `.cols.sort(["${payload.columns.join('", "')}"])`
  },
  DROP_KEEP: (payload) => {
    return `.cols.${payload.command}(["${payload.columns.join('", "')}"])`
  },
}

exports.getGenerator = function(generatorName = '', payload = {}) {
  var generator = codeGenerators[generatorName] || codeGenerators[payload.command] || undefined
  return generator
}

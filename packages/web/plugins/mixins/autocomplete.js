const tokenizeCharacter = (type, value, input, current) => (value === input[current]) ? [1, {type, value}] : [0, null]
const tokenizeCharacterPos = (type, value, input, current) => (value === input[current]) ? [1, {type, value, pos: current}] : [0, null]

const tokenizePattern = (type, pattern, input, current, checkValue = false) => {
  let char = input[current]
  let consumedChars = 0
  if (pattern.test(char)) {
    let value = ''
    while (char && pattern.test(char)) {
      value += char
      consumedChars ++
      char = input[current + consumedChars]
    }
    return [consumedChars , { type, value }]
  }
  return [0, null]
}

const tokenizeString = (input, current) => {
  if (input[current] === '"' || input[current] === "'") {
    let value = ''
    let consumedChars = 1
    let char = input[current + consumedChars]
    while (char !== input[current]) {
      if(char === undefined) {
        throw new TypeError("unterminated string ")
      }
      value += char
      consumedChars ++
      char = input[current + consumedChars]
    }
    return [consumedChars + 1, { type: 'string', value }]
  }
  return [0, null]
}

const tokenizeNameWithSpaces = (input, current) => {
  if (input[current] === '{') {
    let value = ''
    let consumedChars = 1
    let char = input[current + consumedChars]
    while (char !== '}') {
      if(char === undefined) {
        throw new TypeError("unterminated name with spaces ")
      }
      value += char
      consumedChars ++
      char = input[current + consumedChars]
    }
    return [consumedChars + 1, { type: 'name', value }]
  }
  return [0, null]
}

const skipWhiteSpace = (input, current) =>   (/\s/.test(input[current])) ? [1, null] : [0, null]

const tokenizeParenOpen = (input, current) => tokenizeCharacterPos('open_paren', '(', input, current)
const tokenizeParenClose = (input, current) => tokenizeCharacterPos('close_paren', ')', input, current)
const tokenizeSemiColon = (input, current) => tokenizeCharacter('semi_colon', ';', input, current)
const tokenizeComma = (input, current) => tokenizeCharacter('comma', ',', input, current)
const tokenizeNumber = (input, current) => tokenizePattern("number", /[0-9]/, input, current)
const tokenizeName = (input, current) => tokenizePattern("name", /[a-z_]/i, input, current)

// Operators
const tokenizeSum = (input, current) => tokenizeCharacter('operator', '+', input, current)
const tokenizeSub = (input, current) => tokenizeCharacter('operator', '-', input, current)
const tokenizeMul = (input, current) => tokenizeCharacter('binary_operator', '*', input, current)
const tokenizeDiv = (input, current) => tokenizeCharacter('binary_operator', '/', input, current)
const tokenizeNot = (input, current) => tokenizeCharacter('unary_operator', '~', input, current)

const tokenizers = [
  skipWhiteSpace, tokenizeParenOpen, tokenizeParenClose, tokenizeSemiColon, tokenizeNumber, tokenizeString, tokenizeName, tokenizeNameWithSpaces, tokenizeComma,
  tokenizeSum, tokenizeSub, tokenizeMul, tokenizeDiv, tokenizeNot
]

const tokenizer = (input, caret = 0) => {
  let current = 0;
  let tokens = [];
  input = input || '';
  while (current < input.length) {
    let tokenized = false
    tokenizers.forEach(tokenizer_fn => {
        if (tokenized) {return}
        let [consumedChars, token] = tokenizer_fn(input, current)
        let active = false
        if (consumedChars !== 0) {
            tokenized = true
            active = (caret>current && caret<=current+consumedChars)
            current += consumedChars
        }
        if (token) {
            tokens.push({...token, active, startedAt: current-consumedChars, consumedChars})
        } else if (active && tokens[tokens.length-1]) {
            tokens[tokens.length-1].active = true
        }
    })
    if (!tokenized) {
      throw new TypeError("I don't know what this character is: " + input[current])
    }
  }

  let activeCompleteWord = undefined
  let activeWord = undefined
  let activeWordPosition = undefined

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.active) {
        activeCompleteWord = token.value
        var ssl = caret-token.startedAt
        activeWordPosition = token.startedAt
        activeWord = token.value.substr(0,ssl)
    }

  }

  return {tokens, activeCompleteWord, activeWord, activeWordPosition}
}


// parser

function parseExpression (tokens, current) {
  let token = tokens[current]
  let node = {
    type: 'expression',
    active: token.active,
    params: [],
  }
  if (token.type=='comma' || token.type=='open_paren') {
      node.fromType = token.type
      current++
      token = tokens[current]
  }
  while (token && token.type !== 'close_paren' && token.type !== 'comma') {
    let param;
    [current, param] = parseToken(tokens, current);
    if (param.active) {
        node.active = true
    }
    node.params.push(param);
    token = tokens[current];
  }

  if (node.params.length===1)
    return [current, {...node.params[0], active: node.active}]
  return [current, node]
}

function parseFunctionCall (tokens, current) {
  let token = tokens[current]
  let nextToken = tokens[current+1]
  let node = {
    type: 'function',
    value: token.value,
    active: token.active || nextToken.active,
    params: [],
  }
  let highlights = [nextToken.pos];
  current += 1;
  token = tokens[current];
  while (token && token.type !== 'close_paren') {
    let param;
    [current, param] = parseExpression(tokens, current);
    node.params.push(param);
    token = tokens[current];
  }
  if (token && token.pos) {
    highlights.push(token.pos)
  }
  node = { ...node, highlights }
  current++;
  return [current, node];
}

function parseToken (tokens, current) {
  let token = tokens[current];
  let nextToken = tokens[current+1];


  if (token.type === 'name' && nextToken && nextToken.type === 'open_paren') {
    return parseFunctionCall(tokens, current);
  }
  if (token.type === 'open_paren' || token.type === 'comma') {
    return parseExpression(tokens, current);
  }
  // TO-DO: Operations
  return [current+1, token];
}

function parseProgram (tokens) {
  let current = 0;
  let ast = {
    type: 'Program',
    body: [],
  };
  let node = null;
  while (current < tokens.length) {
    [current, node] = parseExpression(tokens, current);
    ast.body.push(node);
    return ast;
  }
  return ast;
}

function parseCode (expression, caret) {
    let tokenizerResult = tokenizer(expression, caret)
    let parserResult = parseProgram(tokenizerResult.tokens);
    return { parserResult, tokenizerResult }
}

function getActive(params) {
  for (let i = 0; i < params.length; i++) {
    var element = params[i];
    if (element && element.active) {
      if (element.params !== undefined) {
        element.params = filterActive(element.params)
      }
      return {...element, index: i}
    } else if (element.params) {
      var activeElement = getActive(element.params)
      if (activeElement) {
        element.params = [activeElement]
        return {...element, index: i}
      }

    }
  }
  return undefined
}

function filterActive (params, root = true) {
  return params.map((param, index)=>({...param, index})).filter(param => param.active).map(param=>{
    if (param.params) {
      param.params = filterActive(param.params, false)
    }
    return param
  })
}

function getActiveChain(inputParams) {
    let tree = getActive(inputParams)
    let element = tree
    let array = []
    while (element) {
        let {params, ...noParamElement} = element
        array.push(noParamElement)
        element = params && params.length ? params[0] : undefined;
    }
    return array
}

function getContext (expression, caret) {

  let result = parseCode(expression,caret)
  let tree = result.parserResult
  let chain = getActiveChain(tree.body)

  let inFunction = chain.filter(node=>node.type==='function')
  inFunction = inFunction[inFunction.length - 1]


  let inName = chain.filter(node=>node.type==='name')
  inName = inName[inName.length - 1]

  if (inFunction) {
    let parameterElementIndex = chain.reverse().findIndex(node=>node.type==='function')+1
    let parameterElement = chain[chain.length-parameterElementIndex]
    inFunction.inParameter = parameterElement ? parameterElement.index : undefined
  }

  let activeWord = result.tokenizerResult.activeWord
  let activeWordPosition = result.tokenizerResult.activeWordPosition
  let activeCompleteWord = result.tokenizerResult.activeCompleteWord

  let highlights = inFunction ? inFunction.highlights.map(pos => ({pos, width: 1})) : [];

  return { highlights, inFunction, inName, activeWord, activeCompleteWord, activeWordPosition }
}

export default {
  methods: {
    getContext
  }
}

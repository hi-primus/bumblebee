interface InactiveToken {
  type: string;
  value: string;
  pos?: number;
  active?: false;
}

interface ActiveToken {
  type: string;
  value: string;
  pos?: number;
  active: true;
  startedAt: number;
  consumedChars: number;
}

type Token = InactiveToken | ActiveToken;

interface TokenNode /* extends Token */ {
  type: string;
  value?: string;
  pos?: number;
  active?: boolean;
  startedAt?: number;
  consumedChars?: number;
  /* end of extends */
  index?: number;
  fromType?: string;
  params: TokenNode[];
  activeParameter?: number;
  highlights?: number[];
}

type ChainTokenNode = TokenNode & {
  chainIndex: number;
  inParameter?: number;
};

export interface SuggestionContext {
  highlights: { pos: number; width: number }[];
  inFunction?: ChainTokenNode;
  inName?: TokenNode;
  activeWord?: string;
  activeCompleteWord?: string;
  activeWordPosition?: number;
  params: TokenNode[];
  activeParameter?: number;
}

export const reservedWords: {
  functions: {
    [key: string]: {
      description: string;
      parameters: {
        type: string | string[];
        name: string;
        description: string;
      }[];
      example: string;
      text: string;
    };
  };
  operators: {
    [key: string]: {
      [key: string]: string;
    };
  };
} = {
  functions: {
    MIN: {
      description: 'Returns the minimum value in a numeric dataset.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value.'
        }
      ],
      example: 'MIN(COL_NAME)',
      text: 'MIN'
    },
    MAX: {
      description: 'Returns the maximum value in a numeric dataset.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value.'
        }
      ],
      example: 'MIN(COL_NAME)',
      text: 'MAX'
    },
    MEAN: {
      description:
        'Returns the numerical average value in a dataset, ignoring text.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value.'
        }
      ],
      example: 'MEAN(COL_NAME)',
      text: 'MEAN'
    },
    MODE: {
      description: 'Returns the most commonly occurring value in a dataset.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value.'
        }
      ],
      example: 'MODE(COL_NAME)',
      text: 'MODE'
    },
    STD: {
      description: 'Calculates the standard deviation based on a sample.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value.'
        }
      ],
      example: 'STD(COL_NAME)',
      text: 'STD'
    },
    SUM: {
      description: 'Returns the sum of a series of numbers and/or cells.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value.'
        }
      ],
      example: 'SUM(COL_NAME)',
      text: 'SUM'
    },
    VAR: {
      description: 'Calculates the variance based on a sample.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value.'
        }
      ],
      example: 'VAR(COL_NAME)',
      text: 'VAR'
    },
    KURTOSIS: {
      description:
        "Calculates the kurtosis of a dataset, which describes the shape, and in particular the 'peakedness' of that dataset.",
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value.'
        }
      ],
      example: 'KURT(COL_NAME)',
      text: 'KURT'
    },
    SKEW: {
      description:
        'Calculates the skewness of a dataset, which describes the symmetry of that dataset about the mean.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value.'
        }
      ],
      example: 'SKEW(COL_NAME)',
      text: 'SKEW'
    },
    MAD: {
      description:
        'Calculates the skewness of a dataset, which describes the symmetry of that dataset about the mean.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Column name or value'
        }
      ],
      example: 'MAD(COL_NAME)',
      text: 'MAD'
    },
    ABS: {
      description: 'Returns the absolute value of a number.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The number of which to return the absolute value.'
        }
      ],
      example: 'ABS(-2)',
      text: 'ABS'
    },
    MOD: {
      description:
        'Returns the result of the modulo operator, the remainder after a division operation.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The number to be divided to find the remainder.'
        },
        {
          type: 'number',
          name: 'divisor',
          description: 'The number to divide by.'
        }
      ],
      example: 'MOD(10, 4)',
      text: 'MOD'
    },
    EXP: {
      description: "Returns Euler's number, e (~2.718) raised to a power.",
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The number of which to return the absolute value.'
        }
      ],
      example: 'ABS(-2)',
      text: 'EXP'
    },
    LOG: {
      description: 'Returns the logarithm of a number with respect to a base.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The value for which to calculate the logarithm.'
        }
      ],
      example: 'LOG(128, 2)',
      text: 'LOG'
    },
    LN: {
      description:
        "Returns the logarithm of a number, base e (Euler's number).",
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The value for which to calculate the logarithm, base e.'
        }
      ],
      example: 'LN(100)',
      text: 'LN'
    },
    POW: {
      description: 'Returns a number raised to a power.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The number to raise to the exponent power.'
        },
        {
          type: 'number',
          name: 'exponent',
          description: 'The exponent to raise base to.'
        }
      ],
      example: 'POW(4, 0.5)',
      text: 'POW'
    },
    CEIL: {
      description:
        'Rounds a number up to the nearest integer multiple of specified significance factor.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description:
            'The value to round up to the nearest integer multiple of factor.'
        }
      ],
      example: 'CEILING(23.25)',
      text: 'CEIL'
    },
    SQRT: {
      description: 'Returns the positive square root of a positive number.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description:
            'The number for which to calculate the positive square root.'
        }
      ],
      example: 'SQRT(9)',
      text: 'SQRT'
    },
    FLOOR: {
      description:
        'Rounds a number down to the nearest integer multiple of specified significance factor.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description:
            'The value to round down to the nearest integer multiple of factor.'
        }
      ],
      example: 'FLOOR(23.25)',
      text: 'FLOOR'
    },
    ROUND: {
      description:
        'Rounds a number to a certain number of decimal places according to standard rules.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The value to round to places number of places.'
        },
        {
          type: 'number',
          name: 'decimals',
          description: 'The value to round to places number of places.'
        }
      ],
      example: 'ROUND(99.44, 1)',
      text: 'ROUND'
    },
    SLICE: {
      description:
        'Returns a slice of a string, list, or map. The slice is specified by a start index, a stop index, and a step.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The value to round to places number of places.'
        },
        {
          type: 'number',
          name: 'start',
          description: 'Start index of slice'
        },
        {
          type: 'number',
          name: 'stop',
          description: 'Stop index of slice'
        },
        {
          type: 'number',
          name: 'step',
          description: 'Refers to the interval between the elements that are included in a slice.'
        }
      ],
      example: "SLICE('Optimus Prime', 0,7,0)",
      text: 'SLICE'
    },
    SIN: {
      description: 'Returns the sin of an angle provided in radians.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The angle to find the sine of, in radians.'
        }
      ],
      example: 'SIN(3.14)',
      text: 'SIN'
    },
    COS: {
      description: 'Returns the cosine of an angle provided in radians.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The angle to find the cosine of, in radians.'
        }
      ],
      example: 'COS(3.14)',
      text: 'COS'
    },
    TAN: {
      description: 'Returns the tangent of an angle provided in radians.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The angle to find the tangent of, in radians.'
        }
      ],
      example: 'TAN(3.14)',
      text: 'TAN'
    },
    ASIN: {
      description: 'Returns the inverse sine of a value, in radians.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description:
            'The value for which to calculate the inverse sine. Must be between -1 and 1, inclusive.'
        }
      ],
      example: 'ASIN(0)',
      text: 'ASIN'
    },
    ACOS: {
      description: 'Returns the inverse cosine of a value, in radians.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description:
            'The value for which to calculate the inverse cosine. Must be between -1 and 1, inclusive.'
        }
      ],
      example: 'ACOS(0)',
      text: 'ACOS'
    },
    ATAN: {
      description: 'Returns the inverse tangent of a value, in radians.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'The value for which to calculate the inverse tangent.'
        }
      ],
      example: 'ATAN(0)',
      text: 'ATAN'
    },
    SINH: {
      description: 'Returns the hyperbolic sine of any real number.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Any real value to calculate the hyperbolic sine of.'
        }
      ],
      example: 'SINH(2)',
      text: 'SINH'
    },
    COSH: {
      description: 'Returns the hyperbolic cosine of any real number.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Any real value to calculate the hyperbolic cosine of.'
        }
      ],
      example: 'COSH(0.48)',
      text: 'COSH'
    },
    TANH: {
      description: 'Returns the hyperbolic tangent of any real number.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description: 'Any real value to calculate the hyperbolic tangent of.'
        }
      ],
      example: 'TANH(1)',
      text: 'TANH'
    },
    ASINH: {
      description: 'Returns the hyperbolic tangent of any real number.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description:
            'The value for which to calculate the inverse hyperbolic sine.'
        }
      ],
      example: 'ASINH(0.9)',
      text: 'ASINH'
    },
    ACOSH: {
      description: 'Returns the inverse hyperbolic cosine of a number.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description:
            'The value for which to calculate the inverse hyperbolic cosine. Must be greater than or equal to 1.'
        }
      ],
      example: 'ACOSH(2)',
      text: 'ACOSH'
    },
    ATANH: {
      description: 'Returns the inverse hyperbolic tangent of a number.',
      parameters: [
        {
          type: ['column', 'number'],
          name: 'col_name',
          description:
            'The value for which to calculate the inverse hyperbolic tangent. Must be between -1 and 1, exclusive.'
        }
      ],
      example: 'ATANH(0.9)',
      text: 'ATANH'
    },
    UPPER: {
      description: 'Returns the inverse hyperbolic tangent of a number.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'Converts a specified string to uppercase.'
        }
      ],
      example: "UPPER('lorem ipsum')",
      text: 'UPPER'
    },
    LOWER: {
      description: 'Converts a specified string to lowercase.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The string to convert to lowercase.'
        }
      ],
      example: "LOWER('LOREM IPSUM')",
      text: 'LOWER'
    },
    TITLE: {
      description: 'Capitalizes each word in a specified string.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description:
            'The text which will be returned with the first letter of each word in uppercase and all other letters in lowercase.'
        }
      ],
      example: "TITLE('optimus prime')",
      text: 'TITLE'
    },
    PAD: {
      description: '.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description:
            'The text which will be returned with the first letter of each word in uppercase and all other letters in lowercase.'
        },
        {
          type: 'number',
          name: 'width',
          description: 'The width of the resulting string.'
        },
        {
          type: 'string',
          name: 'side',
          description:'The side of the string to pad.'
        },
      ],
      example: "PAD('optimus',5,'left')",
      text: 'PAD'
    },
    TRIM: {
      description: 'Removes leading, trailing, and repeated spaces in text.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description:
            'The text or reference to a cell containing text to be trimmed.'
        }
      ],
      example: "TRIM('optimus prime')",
      text: 'TRIM'
    },
    LEN: {
      description: 'Returns the length of a string.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The string whose length will be returned.'
        }
      ],
      example: "LEN('optimus prime')",
      text: 'LEN'
    },
    FIND: {
      description: 'Returns the position at which a string is first found.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The string to look for.'
        },
        {
          type: 'string',
          name: 'text_to_search',
          description:
            'The text to search for the first occurrence of search_for.'
        }
      ],
      example: "FIND(col, 'optimus prime')",
      text: 'FIND'
    },
    RFIND: {
      description: 'Returns the position at which a string is last found.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The string to look for.'
        },
        {
          type: 'string',
          name: 'text_to_search',
          description:
            'The text to search for the first occurrence of search_for.'
        }
      ],
      example: "RFIND(col, 'optimus prime')",
      text: 'RFIND'
    },
    LEFT: {
      description:
        'Returns a substring from the beginning of a specified string.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description:
            'The string from which the left portion will be returned.'
        }
      ],
      example: "LEFT('Optimus', 2)",
      text: 'LEN'
    },
    RIGHT: {
      description: 'Returns a substring from the end of a specified string.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description:
            'The string from which the right portion will be returned.'
        }
      ],
      example: "LEN('optimus prime')",
      text: 'LEN'
    },
    STARTS_WITH: {
      description: 'Returns true if a string starts with a specified string.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The string to look for.'
        }
      ],
      example: "STARTS_WITH('optimus prime', 'optimus')",
      text: 'STARTS_WITH'
    },
    ENDS_WITH: {
      description: 'Returns true if a string ends with a specified string.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The string to look for.'
        }
      ],
      example: "ENDS_WITH('optimus prime', 'prime')",
      text: 'ENDS_WITH'
    },
    EXACT: {
      description: 'Returns true if two strings are exactly the same.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The string to compare to.'
        }
      ],
      example: "EXACT('optimus prime', 'optimus prime')",
      text: 'EXACT'
    },
    YEAR: {
      description: 'Returns the year specified by a given date.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The date from which to extract the year.'
        }
      ],
      example: 'YEAR()',
      text: 'YEAR'
    },
    MONTH: {
      description:
        'Returns the month of the year a specific date falls in, in numeric format.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The date from which to extract the month.'
        }
      ],
      example: 'MONTH()',
      text: 'MONTH'
    },
    DAY: {
      description:
        'Returns the day of the month that a specific date falls on, in numeric format.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The date from which to extract the day.'
        }
      ],
      example: 'DAY()',
      text: 'DAY'
    },
    HOUR: {
      description:
        'Returns the hour component of a specific time, in numeric format.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The time from which to calculate the hour value.'
        }
      ],
      example: 'HOUR()',
      text: 'HOUR'
    },
    MINUTE: {
      description:
        'Returns the minute component of a specific time, in numeric format.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The time from which to calculate the minute value.'
        }
      ],
      example: 'MINUTE()',
      text: 'MINUTE'
    },
    SECOND: {
      description:
        'Returns the second component of a specific time, in numeric format.',
      parameters: [
        {
          type: ['column', 'string'],
          name: 'col_name',
          description: 'The time from which to calculate the second value'
        }
      ],
      example: 'SECOND()',
      text: 'SECOND'
    }
  },
  operators: {
    unary: {
      '~': '~ operator',
      '|': '| operator',
      '&': '& operator',
      '+': '+ operator',
      '-': '- operator'
    },
    binary: {
      '+': '+ operator',
      '-': '- operator',
      '*': '* operator',
      '/': '/ operator',
      '%': '- operator'
    }
  }
};

const tokenizeCharacter = (
  type: string,
  value: string,
  input: string,
  current: number
): [number, Token | null] =>
  value === input[current] ? [1, { type, value }] : [0, null];

const tokenizeCharacterPos = (
  type: string,
  value: string,
  input: string,
  current: number
): [number, Token | null] =>
  value === input[current] ? [1, { type, value, pos: current }] : [0, null];

const tokenizePattern = (
  type: string,
  pattern: RegExp,
  input: string,
  current: number
): [number, Token | null] => {
  let char = input[current];
  let consumedChars = 0;
  if (pattern.test(char)) {
    let value = '';
    while (char && pattern.test(char)) {
      value += char;
      consumedChars++;
      char = input[current + consumedChars];
    }
    return [consumedChars, { type, value }];
  }
  return [0, null];
};

const tokenizeString = (
  input: string,
  current: number
): [number, Token | null] => {
  if (input[current] === '"' || input[current] === "'") {
    let value = '';
    let consumedChars = 1;
    let char = input[current + consumedChars];
    while (char !== input[current]) {
      if (char === undefined) {
        throw new TypeError('unterminated string ');
      }
      value += char;
      consumedChars++;
      char = input[current + consumedChars];
    }
    return [consumedChars + 1, { type: 'string', value }];
  }
  return [0, null];
};

const tokenizeNameWithSpaces = (
  input: string,
  current: number
): [number, { type: 'name'; value: string } | null] => {
  if (input[current] === '{') {
    let value = '';
    let consumedChars = 1;
    let char = input[current + consumedChars];
    while (char !== '}') {
      if (char === undefined) {
        throw new TypeError('unterminated name with spaces ');
      }
      value += char;
      consumedChars++;
      char = input[current + consumedChars];
    }
    return [consumedChars + 1, { type: 'name', value }];
  }
  return [0, null];
};

const skipWhiteSpace = (input: string, current: number): [number, null] => {
  if (/\s/.test(input[current])) {
    return [1, null];
  }
  return [0, null];
};

const tokenizeParenOpen = (input: string, current: number) =>
  tokenizeCharacterPos('open_paren', '(', input, current);
const tokenizeParenClose = (input: string, current: number) =>
  tokenizeCharacterPos('close_paren', ')', input, current);
const tokenizeSemiColon = (input: string, current: number) =>
  tokenizeCharacter('semi_colon', ';', input, current);
const tokenizeComma = (input: string, current: number) =>
  tokenizeCharacter('comma', ',', input, current);
const tokenizeNumber = (input: string, current: number) =>
  tokenizePattern('number', /[0-9.]/, input, current);
const tokenizeName = (input: string, current: number) =>
  tokenizePattern('name', /[a-z_]/i, input, current);

// Operators
const tokenizeSum = (input: string, current: number) =>
  tokenizeCharacter('operator', '+', input, current);
const tokenizeSub = (input: string, current: number) =>
  tokenizeCharacter('operator', '-', input, current);
const tokenizeMul = (input: string, current: number) =>
  tokenizeCharacter('binary_operator', '*', input, current);
const tokenizeDiv = (input: string, current: number) =>
  tokenizeCharacter('binary_operator', '/', input, current);
const tokenizeNot = (input: string, current: number) =>
  tokenizeCharacter('unary_operator', '~', input, current);

const tokenizers = [
  skipWhiteSpace,
  tokenizeParenOpen,
  tokenizeParenClose,
  tokenizeSemiColon,
  tokenizeNumber,
  tokenizeString,
  tokenizeName,
  tokenizeNameWithSpaces,
  tokenizeComma,
  tokenizeSum,
  tokenizeSub,
  tokenizeMul,
  tokenizeDiv,
  tokenizeNot
];

const tokenizer = (input: string, caret = 0) => {
  let current = 0;
  const tokens: Token[] = [];
  input = input || '';
  while (current < input.length) {
    let tokenized = false;
    tokenizers.forEach(tokenizerFunction => {
      if (tokenized) {
        return;
      }
      const [consumedChars, token] = tokenizerFunction(input, current);
      let active = false;
      if (consumedChars !== 0) {
        tokenized = true;
        active = caret > current && caret <= current + consumedChars;
        current += consumedChars;
      }
      if (token) {
        tokens.push({
          ...token,
          active,
          startedAt: current - consumedChars,
          consumedChars
        });
      } else if (active && tokens[tokens.length - 1]) {
        tokens[tokens.length - 1].active = true;
      }
    });
    if (!tokenized) {
      throw new TypeError(
        "I don't know what this character is: " + input[current]
      );
    }
  }

  let activeCompleteWord;
  let activeWord;
  let activeWordPosition;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.active) {
      activeCompleteWord = token.value;
      const ssl = caret - token.startedAt;
      activeWordPosition = token.startedAt;
      activeWord = token.value.substring(0, ssl);
    }
  }

  return { tokens, activeCompleteWord, activeWord, activeWordPosition };
};

// parser

function parseExpression(
  tokens: Token[],
  current: number
): [number, TokenNode] {
  let token = tokens[current];
  const node: TokenNode = {
    type: 'expression',
    active: token.active || false,
    params: []
  };
  if (token.type === 'comma' || token.type === 'open_paren') {
    node.fromType = token.type;
    current++;
    token = tokens[current];
  }

  while (token && token.type !== 'close_paren' && token.type !== 'comma') {
    let param;
    [current, param] = parseToken(tokens, current);
    if (param.active) {
      node.active = true;
    }
    node.params.push(param);
    token = tokens[current];
  }

  if (node.params.length === 1) {
    return [
      current,
      { ...(node.params?.[0] || {}), active: node.active || false } as TokenNode
    ];
  }
  return [current, node];
}

function parseFunctionCall(
  tokens: Token[],
  current: number
): [number, TokenNode] {
  let token = tokens[current];
  const nextToken = tokens[current + 1];
  let node: TokenNode = {
    type: 'function',
    value: token.value,
    active: token.active || (nextToken && nextToken.active),
    params: []
  };
  const highlights: number[] = [];
  if (nextToken) {
    highlights.push(nextToken.pos || 0);
  }
  current += 1;
  token = tokens[current];
  while (token && token.type !== 'close_paren') {
    let param;
    [current, param] = parseExpression(tokens, current);
    node.params.push(param as TokenNode);
    token = tokens[current];
  }
  if (
    token &&
    token.type === 'close_paren' &&
    token.active &&
    tokens[current + 1]
  ) {
    node.active = true;
  }
  if (token && token.pos) {
    highlights.push(token.pos);
  }
  node = { ...node, highlights };
  current++;
  return [current, node];
}

function parseToken(tokens: Token[], current: number): [number, TokenNode] {
  const token = tokens[current];
  const nextToken = tokens[current + 1];

  if (token.type === 'name' && nextToken && nextToken.type === 'open_paren') {
    return parseFunctionCall(tokens, current);
  }
  if (token.type === 'open_paren' || token.type === 'comma') {
    return parseExpression(tokens, current);
  }
  // TO-DO: Operations
  return [current + 1, token as TokenNode];
}

function parseProgram(tokens: Token[]) {
  let current = 0;
  const ast = {
    type: 'Program',
    body: [] as TokenNode[]
  };
  let node = null;
  if (current < tokens.length) {
    [current, node] = parseExpression(tokens, current);
    ast.body.push(node);
    return ast;
  }
  return ast;
}

function parseCode(expression: string, caretPosition: number) {
  const tokenizerResult = tokenizer(expression, caretPosition);
  const parserResult = parseProgram(tokenizerResult.tokens);
  return { parserResult, tokenizerResult };
}

function getActive(params: TokenNode[]): TokenNode | undefined {
  for (let i = 0; i < params.length; i++) {
    const element = params[i];
    if (element && element.active) {
      if (element.params !== undefined) {
        element.params = filterActive(element.params);
      }
      return { ...element, index: i };
    } else if (element.params) {
      const activeElement = getActive(element.params);
      if (activeElement) {
        element.params = [activeElement];
        return { ...element, index: i };
      }
    }
  }
  return undefined;
}

function filterActive(params: TokenNode[]) {
  return params
    .map((param, index) => ({ ...param, index }))
    .filter(param => param.active)
    .map(param => {
      if (param.params) {
        param.params = filterActive(param.params);
      }
      return param;
    });
}

function getActiveChain(inputParams: TokenNode[]) {
  const tree = getActive(deepClone(inputParams));
  let element: TokenNode | undefined = tree;
  const array = [];
  while (element) {
    const { params, ...noParamElement } = element;
    array.push(noParamElement);
    element = params && params.length ? params[0] : undefined;
  }
  return array;
}

export const getSuggestionContext = (
  expression: string,
  caret: number
): SuggestionContext => {
  const result = parseCode(expression, caret);
  const tree = result.parserResult;
  const chain = getActiveChain(tree.body);

  let subChain = chain.slice(0, chain.length - 1);

  if (!subChain.length) {
    subChain = chain;
  }

  const inFunctionNode = subChain
    .map((node, chainIndex) => ({ ...node, chainIndex }))
    .filter(node => node.type === 'function')
    .pop() as ChainTokenNode | undefined;

  const inName = chain.filter(node => node.type === 'name').pop() as
    | ChainTokenNode
    | undefined;

  if (inFunctionNode) {
    const parameterElementIndex = inFunctionNode.chainIndex + 1;
    const parameterElement = chain[parameterElementIndex];
    inFunctionNode.inParameter = parameterElement
      ? parameterElement.index
      : undefined;
  }

  const activeWord = result.tokenizerResult.activeWord;
  const activeWordPosition = result.tokenizerResult.activeWordPosition;
  const activeCompleteWord = result.tokenizerResult.activeCompleteWord;

  const highlights = (inFunctionNode?.highlights || []).map(pos => ({
    pos,
    width: 1
  }));

  return {
    highlights,
    inFunction: inFunctionNode,
    inName,
    params: inFunctionNode?.params || [],
    activeWord,
    activeCompleteWord,
    activeWordPosition
  };
};

import { Client, Source } from 'blurr/types';

import {
  Operation,
  OperationCreator,
  OperationOptions,
} from '@/types/operations';

type Cols = string[];

// Documentation
// createOperation is a helper function to create an Optimus Operation in Bumblebee.
// The creteOperation fields are:
// key: unique key for the operation
// name: name of the operation. This will appear in the UI
// alias: alias for the operation. Used to search for the operation
// description : description of the operation


const createOperation = <TA extends Record<string, unknown>, TR>(
  operationCreator: OperationCreator<TA, TR>,
): Operation<TA, TR> => {
  const operation = { ...operationCreator } as Operation<TA, TR>;
  operation.fields = [...(operationCreator.fields || [])];
  operation.defaultOptions = Object.assign(
    {},
    operationCreator.defaultOptions || {},
    { targetType: 'dataframe' },
  );
  operation.action = (payload: TA) => {
    const options: Partial<OperationOptions> = Object.assign(
      {},
      operation.defaultOptions,
      payload._options as OperationOptions,
    );
    if (options.usesInputDataframe && !payload.source) {
      throw new Error('Input dataframe is required');
    }
    if (
      options.usesInputCols &&
      (!payload.cols ||
        (Array.isArray(payload.cols) && payload.cols.length < 1))
    ) {
      throw new Error('Input columns are required');
    }
    if (options.usesOutputCols && !payload.outputCols) {
      if (options.usesInputCols && payload.cols) {
        payload = {
          ...payload,
          outputCols: payload.cols,
        };
      } else {
        throw new Error('Output columns are required');
      }
    }

    if (options.preview === 'basic columns') {
      payload = {
        ...payload,
        outputCols: (payload.cols as Cols).map(col => `new ${col}`),
      };
    }

    return operationCreator.action(payload);
  };
  return operation;
};

export const operations = [
  createOperation({
    key: 'loadFromUrl',
    name: 'Load from url',
    defaultOptions: {
      saveToNewDataframe: true,
    },
    action: (payload: { blurr: Client; url: string }): Source => {
      return payload.blurr.readCsv(payload.url);
    },
    fields: [
      {
        name: 'url',
        label: 'Url',
        type: 'string',
      },
    ],
    shortcut: 'ff',
  }),
  //Row operations
  createOperation({
    key: 'Drop duplicated',
    name: 'Drop duplicated rows',
    alias: 'drop rows duplicated',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      keep: 'first' | 'last';
      how: 'any' | 'all';
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.rows.dropDuplicated({
        cols: payload.cols,
        keep: payload.keep,
        how: payload.how,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'll',
  }),
  createOperation({
    key: 'Drop Empty',
    name: 'Drop empty rows',
    alias: 'drop empty rows',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      keep: 'first' | 'last';
      how: 'any' | 'all';
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.rows.dropDuplicated({
        cols: payload.cols,
        keep: payload.keep,
        how: payload.how,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'll',
  }),
  // Columns operations

  createOperation({
    key: 'lower',
    name: 'Lowercase column values',
    alias: 'Lowercase letters',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.lower({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'll',
  }),
  createOperation({
    key: 'upper',
    name: 'Uppercase column values',
    alias: 'Uppercase letters',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.upper({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'ul',
  }),
  createOperation({
    key: 'title',
    name: 'Title case column values',
    alias: 'Upper first letter',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.title({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tl',
  }),
  createOperation({
    key: 'capitalize',
    name: 'Capitalize column values',
    alias: 'Upper first letters',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.capitalize({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'cl',
  }),
  createOperation({
    key: 'remove_accents',
    name: 'Remove accents from column values',
    alias: 'Remove accents normalize chars',
    description: 'Remove diacritics from column values',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.normalizeChars({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'lra',
  }),
  createOperation({
    key: 'remove_special_chars',
    name: 'Remove special chars from column values',
    alias: 'Remove special chars',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.removeSpecialChars({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'lra',
  }),
  createOperation({
    key: 'extract',
    name: 'Extract a substring from column values',
    alias: 'Extract a substring from a column value',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      start: number;
      end: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.substring({
        start: payload.start,
        end: payload.end,
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'lra',
  }),
  createOperation({
    key: 'trim whitespaces',
    name: 'Trim whitespaces from column values',
    alias: 'Trim whitespaces',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      start: number;
      end: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.trim({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'lt',
  }),
  createOperation({
    key: 'normalize whitespaces',
    name: 'Normalize whitespaces in column values',
    alias: 'Normalize whitespaces',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      start: number;
      end: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.normalizeSpaces({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'lns',
  }),
  createOperation({
    key: 'left substring',
    name: 'Left substring from column values',
    alias: 'Left substring',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      n: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.left({
        cols: payload.cols,
        n: payload.n,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'll',
  }),
  createOperation({
    key: 'right substring',
    name: 'Get the right substring from column values',
    alias: 'right substring',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      n: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.right({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'lr',
  }),
  createOperation({
    key: 'mid substring',
    name: 'Get the middle substring from column values',
    alias: 'mid',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      start: number;
      end: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.min({
        cols: payload.cols,
        start: payload.start,
        end: payload.end,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'lr',
  }),

  createOperation({
    key: 'pad',
    name: 'Add padding characters',
    alias: 'padding',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      start: number;
      end: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.removeStopWords({
        cols: payload.cols,
        start: payload.start,
        end: payload.end,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'lr',
  }),

  // Numeric
  createOperation({
    key: 'Absolute Value',
    name: 'Calculate the Absolute Value from column values',
    alias: 'mid',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.abs({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'na',
  }),
  createOperation({
    key: 'Round number',
    name: 'Calculate the Round Number from column values',
    alias: 'mid',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      decimals: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.round({
        cols: payload.cols,
        decimals: payload.decimals,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'nr',
  }),
  createOperation({
    key: 'Floor',
    name: 'Calculate de Floor Number from column values',
    alias: 'floor',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.floor({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'nf',
  }),
  createOperation({
    key: 'Ceil',
    name: 'Calculate the Ceil from column values',
    alias: 'ceil',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.ceil({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'nc',
  }),
  createOperation({
    key: 'Modulo',
    name: 'Calculate the Modulo from column values',
    alias: 'modulo',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.mod({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'nc',
  }),
  createOperation({
    key: 'logarithm',
    name: 'Calculate the Logarithm from column values',
    alias: 'log logarithm',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      base: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.log({
        cols: payload.cols,
        base: payload.base,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'nl',
  }),
  createOperation({
    key: 'natural logarithm',
    name: 'Calculate the natural Logarithm from column values',
    alias: 'natural logarithm',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.ln({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'nnl',
  }),
  createOperation({
    key: 'power',
    name: 'Calculate the power from column values',
    alias: 'power',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      power: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.pow({
        cols: payload.cols,
        power: payload.power,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'np',
  }),
  createOperation({
    key: 'square root',
    name: 'Calculate the Square Root from column values',
    alias: 'square root sqrt',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.sqrt({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'np',
  }),
  // Trigonometrics
  createOperation({
    key: 'sin',
    name: 'Calculate the sine from column values',
    alias: 'sin sine',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.sin({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'ts',
  }),
  //  Create the creaOperatino fon cos
  createOperation({
    key: 'cos',
    name: 'Calculate the cosine from column values',
    alias: 'cos cosine',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.cos({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tc',
  }),
  //  Create the creaOperatino for tan
  createOperation({
    key: 'tan',
    name: 'Calculate the tangent from column values',
    alias: 'tan tangent',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.tan({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tt',
  }),
  createOperation({
    key: 'asin',
    name: 'Calculate the arcsine from column values',
    alias: 'asin arcsine arcsin',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.asin({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tas',
  }),
  //  Create the creaOperatino fon cos
  createOperation({
    key: 'acos',
    name: 'Calculate the acosine from column values',
    alias: 'acos acosine arccosine arccos',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.acos({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tac',
  }),
  //  Create the creaOperatino for tan
  createOperation({
    key: 'atan',
    name: 'Calculate the arc tangent from column values',
    alias: 'atan atangent arctan atan arctangent',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.atan({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tat',
  }),
  createOperation({
    key: 'sinh',
    name: 'Calculate the hyperbolic sine from column values',
    alias: 'sinh hyperbolic sin sine',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.sinh({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tsh',
  }),
  //  Create the creaOperatino fon cos
  createOperation({
    key: 'cosh',
    name: 'Calculate the hyperbolic cosine from column values',
    alias: 'cosh hyperbolic cos cosine',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.cosh({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tch',
  }),
  //  Create the creaOperatino for tan
  createOperation({
    key: 'tanh',
    name: 'Calculate the hyperbolic tangent from column values',
    alias: 'tanh hyperbolic tan tangent',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.tanh({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tth',
  }),
  createOperation({
    key: 'asinh',
    name: 'Calculate the inverse hyperbolic sine from column values',
    alias: 'asinh arc hyperbolic sin sine inverse',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.asinh({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tash',
  }),
  //  Create the creaOperatino fon cos
  createOperation({
    key: 'acosh',
    name: 'Calculate the inverse hyperbolic cosine from column values',
    alias: 'acosh arc hyperbolic cos cosine inverse',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.acosh({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tach',
  }),
  //  Create the creaOperatino for tan
  createOperation({
    key: 'atanh',
    name: 'Calculate the hyperbolic tangent from column values',
    alias: 'atanh arc hyperbolic tan tangent inverse',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.atanh({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'tath',
  }),
  // Date/Time Functions
  createOperation({
    key: 'Extract from Date',
    name: 'Extract a part of a date from a column',
    alias: 'extract date year month day hour minute second',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      type: unknown;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      const outputFormat = payload.type as { name: string; format: string };
      return payload.source.cols.formatDate({
        cols: payload.cols,
        outputFormat,
        outputCols: payload.outputCols,
      });
    },
    fields: [
      {
        name: 'type',
        label: 'Type',
        type: 'custom',
        options: [
          { value: { name: 'year', format: '%Y' }, text: 'Year' },
          { value: { name: 'year', format: '%y' }, text: 'Year (short)' },
          { value: { name: 'month', format: '%B' }, text: 'Month name' },
          { value: { name: 'month', format: '%b' }, text: 'Month name (short)' },
          { value: { name: 'month', format: '%m' }, text: 'Month as number' },
          { value: { name: 'day', format: '%d' }, text: 'Day of month' },
          { value: { name: 'weekday', format: '%A' }, text: 'Weekday' },
          { value: { name: 'weekday', format: '%a' }, text: 'Weekday (short)' },
          { value: { name: 'weekday', format: '%w' }, text: 'Weekday as a number' },
          { value: { name: 'hour', format: '%I' }, text: 'Hour (00-12)' },
          { value: { name: 'hour', format: '%H' }, text: 'Hour (00-23)' },
          { value: { name: 'AM/PM', format: '%p' }, text: 'AM/PM' },
          { value: { name: 'minute', format: '%M' }, text: 'Minute' },
          { value: { name: 'UTC offset', format: '%z' }, text: 'UTC offset' },
          { value: { name: 'timezone', format: '%Z' }, text: 'Timezone' },
          { value: { name: 'day', format: '%j' }, text: 'Day number of year' },
          { value: { name: 'weekday', format: '%u' }, text: 'Weekday of year (Mon as 1st)' },
          { value: { name: 'weekday', format: '%U' }, text: 'Weekday of year (Sun as 1st)' },
        ],
      },
    ],
    shortcut: 'sed',
  }),
  createOperation({
    key: 'Extract from Date',
    name: 'Extract a part of a date from a column',
    alias: 'extract date year month day hour minute second',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      type: unknown;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      const outputFormat = payload.type as { name: string; format: string };
      return payload.source.cols.formatDate({
        cols: payload.cols,
        outputFormat,
        outputCols: payload.outputCols,
      });
    },
    fields: [
      {
        name: 'type',
        label: 'Type',
        type: 'custom',
        options: [
          { value: { name: 'year', format: '%Y' }, text: 'Year Between' },
          { value: { name: 'year', format: '%y' }, text: 'Months Between' },
          { value: { name: 'month', format: '%B' }, text: 'Days Between' },
          { value: { name: 'month', format: '%b' }, text: 'Hours Between' },
          { value: { name: 'month', format: '%m' }, text: 'Minutes Between' },
          { value: { name: 'day', format: '%d' }, text: 'Seconds Between' },
        ],
      },
    ],
    shortcut: 'sed',
  }),
  // ML
  createOperation({
    key: 'sample',
    name: 'Get n samples from the dataframe',
    alias: 'sample',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      n: number,
      seed: number,
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.atanh({
        cols: payload.cols,
        n: payload.n,
        seed: payload.seed,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'ms',
  }),
  createOperation({
    key: 'impute',
    name: 'Impute missing values in a column',
    alias: 'impute fill missing values',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      strategy: string,
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.impute({
        cols: payload.cols,
        strategy: payload.strategy,
        outputCols: payload.outputCols,
      });
    },
    fields: [
      {
        name: 'strategy',
        label: 'Fill empty values with',
        options: [
          { value: 'mean', text: 'Mean' },
          { value: 'median', text: 'Median' },
          { value: 'most_frequent', text: 'Most frequent' },
          { value: 'constant', text: 'Constant' },
        ],
        type: 'string',
      },
    ],
    shortcut: 'mi',
  }),
  createOperation({
    key: 'One hot encoding',
    name: 'One hot encode the columns value',
    alias: 'one hot encoding encode',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',

    },
    action: (payload: {
      source: Source;
      cols: Cols;
      prefix: string,
      drop: boolean,
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.oneHotEncode({
        cols: payload.cols,
        prefix: payload.prefix,
        drop: payload.drop,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'mo',
  }),
  createOperation({
    key: 'String to Index',
    name: 'Convert string values to integer in a column',
    alias: 'string to index',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.stringToIndex({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'msi',
  }),
  createOperation({
    key: 'Index to String',
    name: 'Convert Index values back to String in a column',
    alias: 'index to string',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.indexToString({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'mis',
  }),
  createOperation({
    key: 'ZScore',
    name: 'Calculate the z-score in a column',
    alias: 'zscore',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.zScore({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'msi',
  }),
  createOperation({
    key: 'Standard Scaler',
    name: 'Calculate the standard scaler in a column',
    alias: 'standard scaler',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.standardScaler({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'mss',
  }),
  createOperation({
    key: 'Min Max Scaler',
    name: 'Calculate the Min max scaler in a column',
    alias: 'minmax min max scaler',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.minMaxScaler({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'mmms',
  }),
  createOperation({
    key: 'Min Max Scaler',
    name: 'Calculate the Min max scaler in a column',
    alias: 'minmax min max scaler',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.maxAbsScaler({
        cols: payload.cols,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'mmas',
  }),

  //
  createOperation({
    key: 'Remove Stop-words',
    name: 'Remove stop-words from column values',
    alias: 'mid',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      start: number;
      end: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.removeStopWords({
        cols: payload.cols,
        start: payload.start,
        end: payload.end,
        outputCols: payload.outputCols,
      });
    },
    shortcut: 'lr',
  }),
  createOperation({
    key: 'unnestColumns',
    name: 'Unnest columns',
    alias: 'Split cols unnest',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      separator: string;
    }): Source => {
      return payload.source.cols.unnest({
        cols: payload.cols,
        separator: payload.separator,
      });
    },
    fields: [
      {
        name: 'separator',
        label: 'Separator',
        type: 'string',
      },
    ],
    shortcut: 'cu',
  }),
  createOperation({
    key: 'nestColumns',
    name: 'Nest columns',
    alias: 'Unsplit cols nest',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: true,
    },
    action: (payload: {
      options: OperationOptions;
      source: Source;
      cols: Cols;
      separator: string;
    }): Source => {
      if (payload.options.preview) {
        if (payload.cols.length <= 1) {
          throw new Error('[PREVIEW] At least two columns are required', {
            cause: payload.cols,
          });
        }
      }
      const drop = !payload.options.preview;
      return payload.source.cols.nest({
        cols: payload.cols,
        separator: payload.separator,
        drop,
      });
    },
    fields: [
      {
        name: 'separator',
        label: 'Separator',
        type: 'string',
      },
    ],
    shortcut: 'cn',
  }),
];

import { Client, Source } from 'blurr/types';

import { isObject } from '@/types/common';
import {
  Operation,
  OperationCreator,
  OperationOptions,
  Payload
} from '@/types/operations';

type Cols = string[];

export const operationCreators: OperationCreator[] = [
  {
    key: 'loadFromUrl',
    name: 'Load from url',
    defaultOptions: {
      saveToNewDataframe: true,
      preview: 'whole'
    },
    action: (payload: {
      blurr: Client;
      url: string;
      nRows?: number;
      options: OperationOptions;
    }): Source => {
      if (payload.options.preview) {
        payload.nRows = Math.min(payload.nRows || 50, 50);
      }

      return payload.blurr.readCsv({
        url: payload.url,
        nRows: payload.nRows
      });
    },
    fields: [
      {
        name: 'url',
        label: 'Url',
        type: 'string'
      }
    ],
    shortcut: 'ff'
  },
  {
    key: 'setCol',
    name: 'Set column',
    defaultOptions: {
      usesInputCols: 'single',
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      replaces: {
        condition: string;
        value: string;
        replaceBy: string;
      }[];
      otherwise: string;
      options: OperationOptions;
    }): Source => {
      const where = payload.replaces.map(replace => {
        // check if replace.value is a number string
        let value: string | number = replace.value;
        let condition = replace.condition;
        if (!isNaN(Number(value))) {
          value = Number(value);
          condition = `numeric_${condition}`;
        }
        switch (condition) {
          case 'equal':
            return `df["${payload.cols[0]}"]=="${value}"`;
          case 'not_equal':
            return `df["${payload.cols[0]}"]!="${value}"`;
          case 'numeric_equal':
            return `(df["${payload.cols[0]}"]==${value}) | (df["${payload.cols[0]}"]=="${value}")`;
          case 'numeric_not_equal':
            return `(df["${payload.cols[0]}"]!=${value}) & (df["${payload.cols[0]}"]!="${value}")`;
          default:
            console.warn('Unknown condition', condition);
        }
        return '';
      });

      const result = payload.source.cols.set({
        cols: payload.outputCols,
        valueFunc: payload.replaces.map(r => r.replaceBy),
        evalValue: false,
        where,
        default: payload.otherwise
      });
      if (payload.outputCols[0] !== payload.cols[0]) {
        return result.cols.move({
          column: payload.outputCols[0],
          position: 'after',
          refCol: payload.cols[0]
        });
      }

      return result;
    },
    fields: [
      {
        name: 'replaces',
        label: 'Replaces',
        type: 'group',
        fields: [
          {
            name: 'condition',
            label: 'Condition',
            type: 'string',
            defaultValue: 'equal',
            options: (_payload: Payload) => [
              {
                text: 'Is exactly',
                value: 'equal'
              },
              {
                text: 'Is one of',
                value: 'value_in',
                hidden: true
              },
              {
                text: 'Is not',
                value: 'not_equal'
              },
              { divider: true, hidden: true },
              {
                text: 'Less than',
                value: 'less_than',
                hidden: true
              },
              {
                text: 'Less than or equal to',
                value: 'less_than_equal',
                hidden: true
              },
              {
                text: 'Greater than',
                value: 'greater_than',
                hidden: true
              },
              {
                text: 'Greater than or equal to',
                value: 'greater_than_equal',
                hidden: true
              },
              {
                text: 'Is Between',
                value: 'between',
                hidden: true
              },
              { divider: true, hidden: true },
              {
                text: 'Contains',
                value: 'contains',
                hidden: true
              },
              {
                text: 'Starts with',
                value: 'starts_with',
                hidden: true
              },
              {
                text: 'Ends with',
                value: 'ends_with',
                hidden: true
              },
              { divider: true, hidden: true },
              { text: 'Custom expression', value: 'where', hidden: true },
              {
                text: 'Pattern',
                value: 'match_pattern',
                hidden: true
              },
              { text: 'Selected', value: 'selected', hidden: true },
              { divider: true, hidden: true },
              {
                text: 'Mismatches values',
                value: 'mismatch',
                hidden: true
              },
              { text: 'Null values', value: 'null', hidden: true }
            ],
            class: 'grouped-first w-[31.3333%]'
          },
          {
            name: 'value',
            label: 'Value',
            type: 'string',
            class: 'grouped-middle w-[31.3333%]'
          },
          {
            name: 'replaceBy',
            label: 'Replace by',
            type: 'string',
            class: 'grouped-last w-[31.3333%]'
          }
        ]
      },
      {
        name: 'otherwise',
        label: 'Otherwise',
        type: 'string'
      }
    ],
    shortcut: 'sc'
  },
  {
    key: 'replace',
    name: 'Replace in column values',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      replaces: {
        search: string;
        replaceBy: string;
      }[];
      searchBy: string;
      matchCase: OperationOptions;
    }): Source => {
      const result = payload.source.cols.replace({
        cols: payload.cols,
        search: payload.replaces.map(replace => replace.search),
        replaceBy: payload.replaces.map(replace => replace.replaceBy),
        searchBy: payload.searchBy,
        ignoreCase: !payload.matchCase,
        outputCols: payload.outputCols
      });
      if (payload.outputCols[0] !== payload.cols[0]) {
        return result.cols.move({
          column: payload.outputCols[0],
          position: 'after',
          refCol: payload.cols[0]
        });
      }

      return result;
    },
    fields: [
      {
        name: 'replaces',
        label: 'Replaces',
        type: 'group',
        fields: [
          {
            name: 'search',
            label: 'Search',
            type: 'string',
            class: 'grouped-first w-[47%]'
          },
          {
            name: 'replaceBy',
            label: 'Replace by',
            type: 'string',
            class: 'grouped-last w-[47%]'
          }
        ]
      },
      {
        name: 'searchBy',
        label: 'Search by',
        type: 'string',
        defaultValue: 'full',
        options: [
          {
            text: 'Exact match',
            value: 'full'
          },
          {
            text: 'Contains words',
            value: 'words'
          },
          {
            text: 'Contains characters',
            value: 'chars'
          }
        ]
      },
      {
        name: 'matchCase',
        label: 'Match case',
        type: 'boolean'
      }
      // TODO: search by string
    ],
    shortcut: 'rc'
  },
  // Row operations
  {
    key: 'Drop duplicated',
    name: 'Drop duplicated rows',
    alias: 'drop rows duplicated',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'll'
  },
  {
    key: 'Drop Empty',
    name: 'Drop empty rows',
    alias: 'drop empty rows',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'll'
  },
  // Columns operations
  {
    key: 'lower',
    name: 'Lowercase column values',
    alias: 'Lowercase letters',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.lower({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'll'
  },
  {
    key: 'upper',
    name: 'Uppercase column values',
    alias: 'Uppercase letters',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.upper({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'ul'
  },
  {
    key: 'title',
    name: 'Title case column values',
    alias: 'Upper first letter',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.title({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tl'
  },
  {
    key: 'capitalize',
    name: 'Capitalize column values',
    alias: 'Upper first letters',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.capitalize({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'cl'
  },
  {
    key: 'remove_accents',
    name: 'Remove accents from column values',
    alias: 'Remove accents normalize chars',
    description: 'Remove diacritics from column values',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.normalizeChars({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lra'
  },
  {
    key: 'remove_special_chars',
    name: 'Remove special chars from column values',
    alias: 'Remove special chars',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.removeSpecialChars({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lra'
  },
  {
    key: 'extract',
    name: 'Extract a substring from column values',
    alias: 'Extract a substring from a column value',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lra'
  },
  {
    key: 'trim whitespaces',
    name: 'Trim whitespaces from column values',
    alias: 'Trim whitespaces',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lt'
  },
  {
    key: 'normalize whitespaces',
    name: 'Normalize whitespaces in column values',
    alias: 'Normalize whitespaces',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lns'
  },
  {
    key: 'left substring',
    name: 'Left substring from column values',
    alias: 'Left substring',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'll'
  },
  {
    key: 'right substring',
    name: 'Get the right substring from column values',
    alias: 'right substring',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lr'
  },
  {
    key: 'mid substring',
    name: 'Get the middle substring from column values',
    alias: 'mid',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lr'
  },
  {
    key: 'pad',
    name: 'Add padding characters',
    alias: 'padding',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lr'
  },

  // Numeric
  {
    key: 'Absolute Value',
    name: 'Calculate the Absolute Value from column values',
    alias: 'mid',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.abs({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'na'
  },
  {
    key: 'Round number',
    name: 'Calculate the Round Number from column values',
    alias: 'mid',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'nr'
  },
  {
    key: 'Floor',
    name: 'Calculate de Floor Number from column values',
    alias: 'floor',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.floor({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'nf'
  },
  {
    key: 'Ceil',
    name: 'Calculate the Ceil from column values',
    alias: 'ceil',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.ceil({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'nc'
  },
  {
    key: 'Modulo',
    name: 'Calculate the Modulo from column values',
    alias: 'modulo',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.mod({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'nc'
  },
  {
    key: 'logarithm',
    name: 'Calculate the Logarithm from column values',
    alias: 'log logarithm',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'nl'
  },
  {
    key: 'natural logarithm',
    name: 'Calculate the natural Logarithm from column values',
    alias: 'natural logarithm',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.ln({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'nnl'
  },
  {
    key: 'power',
    name: 'Calculate the power from column values',
    alias: 'power',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'np'
  },
  {
    key: 'square root',
    name: 'Calculate the Square Root from column values',
    alias: 'square root sqrt',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.sqrt({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'np'
  },
  // Trigonometrics
  {
    key: 'sin',
    name: 'Calculate the sine from column values',
    alias: 'sin sine',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.sin({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'ts'
  },
  //  Create the creaOperatino fon cos
  {
    key: 'cos',
    name: 'Calculate the cosine from column values',
    alias: 'cos cosine',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.cos({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tc'
  },
  //  Create the creaOperatino for tan
  {
    key: 'tan',
    name: 'Calculate the tangent from column values',
    alias: 'tan tangent',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.tan({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tt'
  },
  {
    key: 'asin',
    name: 'Calculate the arcsine from column values',
    alias: 'asin arcsine arcsin',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.asin({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tas'
  },
  //  Create the creaOperatino fon cos
  {
    key: 'acos',
    name: 'Calculate the acosine from column values',
    alias: 'acos acosine arccosine arccos',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.acos({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tac'
  },
  //  Create the creaOperatino for tan
  {
    key: 'atan',
    name: 'Calculate the arc tangent from column values',
    alias: 'atan atangent arctan atan arctangent',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.atan({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tat'
  },
  {
    key: 'sinh',
    name: 'Calculate the hyperbolic sine from column values',
    alias: 'sinh hyperbolic sin sine',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.sinh({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tsh'
  },
  //  Create the creaOperatino fon cos
  {
    key: 'cosh',
    name: 'Calculate the hyperbolic cosine from column values',
    alias: 'cosh hyperbolic cos cosine',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.cosh({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tch'
  },
  //  Create the creaOperatino for tan
  {
    key: 'tanh',
    name: 'Calculate the hyperbolic tangent from column values',
    alias: 'tanh hyperbolic tan tangent',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.tanh({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tth'
  },
  {
    key: 'asinh',
    name: 'Calculate the inverse hyperbolic sine from column values',
    alias: 'asinh arc hyperbolic sin sine inverse',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.asinh({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tash'
  },
  //  Create the creaOperatino fon cos
  {
    key: 'acosh',
    name: 'Calculate the inverse hyperbolic cosine from column values',
    alias: 'acosh arc hyperbolic cos cosine inverse',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.acosh({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tach'
  },
  //  Create the creaOperatino for tan
  {
    key: 'atanh',
    name: 'Calculate the hyperbolic tangent from column values',
    alias: 'atanh arc hyperbolic tan tangent inverse',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.atanh({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'tath'
  },
  // Date/Time Functions
  {
    key: 'Extract from Date',
    name: 'Extract a part of a date from a column',
    alias: 'extract date year month day hour minute second',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
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
          {
            value: { name: 'month', format: '%b' },
            text: 'Month name (short)'
          },
          { value: { name: 'month', format: '%m' }, text: 'Month as number' },
          { value: { name: 'day', format: '%d' }, text: 'Day of month' },
          { value: { name: 'weekday', format: '%A' }, text: 'Weekday' },
          { value: { name: 'weekday', format: '%a' }, text: 'Weekday (short)' },
          {
            value: { name: 'weekday', format: '%w' },
            text: 'Weekday as a number'
          },
          { value: { name: 'hour', format: '%I' }, text: 'Hour (00-12)' },
          { value: { name: 'hour', format: '%H' }, text: 'Hour (00-23)' },
          { value: { name: 'AM/PM', format: '%p' }, text: 'AM/PM' },
          { value: { name: 'minute', format: '%M' }, text: 'Minute' },
          { value: { name: 'UTC offset', format: '%z' }, text: 'UTC offset' },
          { value: { name: 'timezone', format: '%Z' }, text: 'Timezone' },
          { value: { name: 'day', format: '%j' }, text: 'Day number of year' },
          {
            value: { name: 'weekday', format: '%u' },
            text: 'Weekday of year (Mon as 1st)'
          },
          {
            value: { name: 'weekday', format: '%U' },
            text: 'Weekday of year (Sun as 1st)'
          }
        ]
      }
    ],
    shortcut: 'sed'
  },
  {
    key: 'Extract from Date',
    name: 'Extract a part of a date from a column',
    alias: 'extract date year month day hour minute second',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
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
          { value: { name: 'day', format: '%d' }, text: 'Seconds Between' }
        ]
      }
    ],
    shortcut: 'sed'
  },
  // ML
  {
    key: 'sample',
    name: 'Get n samples from the dataframe',
    alias: 'sample',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      n: number;
      seed: number;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.atanh({
        cols: payload.cols,
        n: payload.n,
        seed: payload.seed,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'ms'
  },
  {
    key: 'impute',
    name: 'Impute missing values in a column',
    alias: 'impute fill missing values',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      strategy: string;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.impute({
        cols: payload.cols,
        strategy: payload.strategy,
        outputCols: payload.outputCols
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
          { value: 'constant', text: 'Constant' }
        ],
        type: 'string',
        defaultValue: 'mean'
      }
    ],
    shortcut: 'mi'
  },
  {
    key: 'One hot encoding',
    name: 'One hot encode the columns value',
    alias: 'one hot encoding encode',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      prefix: string;
      drop: boolean;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.oneHotEncode({
        cols: payload.cols,
        prefix: payload.prefix,
        drop: payload.drop,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'mo'
  },
  {
    key: 'String to Index',
    name: 'Convert string values to integer in a column',
    alias: 'string to index',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.stringToIndex({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'msi'
  },
  {
    key: 'Index to String',
    name: 'Convert Index values back to String in a column',
    alias: 'index to string',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.indexToString({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'mis'
  },
  {
    key: 'ZScore',
    name: 'Calculate the z-score in a column',
    alias: 'zscore',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.zScore({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'msi'
  },
  {
    key: 'Standard Scaler',
    name: 'Calculate the standard scaler in a column',
    alias: 'standard scaler',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.standardScaler({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'mss'
  },
  {
    key: 'Min Max Scaler',
    name: 'Calculate the Min max scaler in a column',
    alias: 'minmax min max scaler',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.minMaxScaler({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'mmms'
  },
  {
    key: 'Min Max Scaler',
    name: 'Calculate the Min max scaler in a column',
    alias: 'minmax min max scaler',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      outputCols: Cols;
      options: OperationOptions;
    }): Source => {
      return payload.source.cols.maxAbsScaler({
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'mmas'
  },

  //
  {
    key: 'Remove Stop-words',
    name: 'Remove stop-words from column values',
    alias: 'mid',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
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
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lr'
  },
  {
    key: 'unnestColumns',
    name: 'Unnest columns',
    alias: 'Split cols unnest',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true
    },
    action: (payload: {
      source: Source;
      cols: Cols;
      separator: string;
    }): Source => {
      return payload.source.cols.unnest({
        cols: payload.cols,
        separator: payload.separator
      });
    },
    fields: [
      {
        name: 'separator',
        label: 'Separator',
        type: 'string'
      }
    ],
    shortcut: 'cu'
  },
  {
    key: 'nestColumns',
    name: 'Nest columns',
    alias: 'Unsplit cols nest',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: true
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
            cause: payload.cols
          });
        }
      }
      const drop = !payload.options.preview;
      return payload.source.cols.nest({
        cols: payload.cols,
        separator: payload.separator,
        drop
      });
    },
    fields: [
      {
        name: 'separator',
        label: 'Separator',
        type: 'string'
      }
    ],
    shortcut: 'cn'
  }
];

/**
 * helper function to create an Optimus / Blurr operations in Bumblebee
 * @param operationCreator
 * operationCreator properties:
 * key: unique key for the operation
 * name: name of the operation. This will appear in the UI
 * alias: alias for the operation. Used to search for the operation
 * description: description of the operation
 * fields: fields to be displayed in the UI
 * defaultOptions: default options for the operation
 * shortcut: shortcut for the operation
 * action: function that will be called when the operation is executed
 * uses: key of another operation that this operation uses (if 'action' is not defined)
 * payload: payload for the operation (if 'uses' is defined)
 * @template TA arguments (kwargs) type
 * @template TR return type
 * @returns
 */

const createOperation = (operationCreator: OperationCreator): Operation => {
  if ('uses' in operationCreator) {
    const foundOperation = operationCreators.find(
      operation => operation.key === operationCreator.uses
    );
    if (!foundOperation) {
      throw new Error(`Operation ${operationCreator.uses} not found`);
    }

    const operation = createOperation({
      ...foundOperation,
      shortcut: operationCreator.shortcut,
      name: operationCreator.name,
      alias: operationCreator.alias,
      description: operationCreator.description
    });

    if (
      'defaultPayload' in operationCreator &&
      operationCreator.defaultPayload &&
      isObject(operationCreator.defaultPayload)
    ) {
      operation.fields = operation.fields.map(field => {
        const newField = { ...field };
        if (
          operationCreator.defaultPayload &&
          newField.name in operationCreator.defaultPayload
        ) {
          if (newField.type !== 'group') {
            newField.defaultValue =
              operationCreator.defaultPayload[newField.name];
          }
        }
        return newField;
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return operation as any;
  }

  const operation = { ...operationCreator } as Operation;
  operation.fields = [...(operationCreator.fields || [])];
  operation.defaultOptions = Object.assign(
    {},
    operationCreator.defaultOptions || {},
    { targetType: 'dataframe' }
  );
  operation.action = payload => {
    const options: Partial<OperationOptions> = Object.assign(
      {},
      operation.defaultOptions,
      payload.options as OperationOptions
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
          outputCols: payload.cols
        };
      } else {
        throw new Error('Output columns are required');
      }
    }

    if (options.preview === 'basic columns' && payload.cols) {
      payload = {
        ...payload,
        outputCols: (payload.cols as Cols).map(
          col => `__bumblebee__preview__${col}`
        )
      };
    }

    return operationCreator.action(payload);
  };
  return operation;
};

export const operations = operationCreators.map(operationCreator =>
  createOperation(operationCreator)
);

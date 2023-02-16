import { Client, Source } from 'blurr/types';

import { isObject } from '@/types/common';
import {
  Operation,
  OperationCreator,
  OperationOptions,
  Payload
} from '@/types/operations';

type Cols = string[];

type OperationPayload<
  T extends Record<string, unknown> = Record<string, unknown>
> = {
  blurr: Client;
  source: Source;
  target: string;
  cols: Cols;
  outputCols: Cols;
  options: OperationOptions;
} & T;

export const operationCreators: OperationCreator[] = [
  {
    key: 'loadFromUrl',
    name: 'Load from url',
    defaultOptions: {
      saveToNewDataframe: true,
      preview: 'whole'
    },
    action: (
      payload: OperationPayload<{
        url: string;
        nRows?: number;
      }>
    ): Source => {
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
    key: 'createCol',
    name: 'Create column',
    defaultOptions: {
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: async (
      payload: OperationPayload<{
        sets: {
          outputColumn: string;
          value: string;
        }[];
      }>
    ): Promise<Source> => {
      const valueFuncPromise = await Promise.allSettled(
        payload.sets.map(s => {
          return payload.blurr.runCode(`parse('${s.value}')`);
        })
      );

      const valueFunc = valueFuncPromise.map(p =>
        p.status === 'fulfilled' ? p.value : null
      );

      let outputCols = payload.sets.map(s => s.outputColumn);

      if (payload.options.preview) {
        outputCols = outputCols.map(c => `__bumblebee__preview__${c}`);
      }

      return payload.source.cols.set({
        target: payload.target,
        cols: outputCols,
        valueFunc,
        evalValue: true
      });
    },
    fields: [
      {
        name: 'sets',
        label: 'Columns',
        type: 'group',
        fields: [
          {
            name: 'outputColumn',
            label: 'Column',
            type: 'string',
            defaultValue: '',
            class: 'grouped-first w-1/3'
          },
          {
            name: 'value',
            label: 'Formula',
            placeholder: 'e.g. col1 + col2, col1 + "suffix"',
            type: 'string',
            class: 'grouped-last w-2/3'
          }
        ]
      }
    ],
    shortcut: 'cc'
  },
  {
    key: 'setCol',
    name: 'Set column',
    defaultOptions: {
      usesInputCols: 'single',
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (
      payload: OperationPayload<{
        replaces: {
          condition: string;
          value: string;
          replaceBy: string;
        }[];
        otherwise: string;
      }>
    ): Source => {
      const where = payload.replaces.map(replace =>
        whereExpression(replace.condition, replace.value, payload.cols[0])
      );

      const result = payload.source.cols.set({
        target: payload.target,
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
            options: (payload: Payload) => [
              {
                text: 'Is exactly',
                value: 'equal'
              },
              {
                text: 'Is one of',
                value: 'value_in'
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
            class: (payload: Payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              if (condition === 'value_in') {
                return 'w-full';
              }
              if (condition === 'between') {
                return 'grouped-first w-1/4';
              }
              return 'grouped-first w-1/3';
            }
          },
          {
            name: 'value',
            label: (payload: Payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              if (condition === 'value_in') {
                return 'Values';
              }
              if (condition === 'between') {
                return 'Min';
              }
              if (condition === 'match_pattern') {
                return 'Pattern';
              }
              if (condition === 'where') {
                return 'Expression';
              }
              return 'Value';
            },
            type: 'string',
            class: (payload: Payload, currentIndex = 0): string => {
              const condition = payload.replaces[currentIndex].condition;
              if (condition === 'value_in') {
                return 'w-full';
              }
              if (condition === 'between') {
                return 'grouped-middle w-1/4';
              }
              return 'grouped-middle w-1/3';
            }
          },
          {
            name: 'value_2',
            label: 'Max',
            type: 'string',
            class: 'grouped-middle w-1/4',
            hidden: (payload: Payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              return condition !== 'between';
            }
          },
          {
            name: 'replaceBy',
            label: 'Replace by',
            type: 'string',
            class: (payload: Payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              if (condition === 'value_in') {
                return 'w-full';
              }
              if (condition === 'between') {
                return 'grouped-last w-1/4';
              }
              return 'grouped-last w-1/3';
            }
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
    action: (
      payload: OperationPayload<{
        replaces: {
          search: string;
          replaceBy: string;
        }[];
        searchBy: string;
        matchCase: OperationOptions;
      }>
    ): Source => {
      const result = payload.source.cols.replace({
        target: payload.target,
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
            class: 'grouped-first w-1/2'
          },
          {
            name: 'replaceBy',
            label: 'Replace by',
            type: 'string',
            class: 'grouped-last w-1/2'
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
    key: 'filterRows',
    name: 'Filter rows',
    alias: 'drop keep rows',
    defaultOptions: {
      usesInputCols: true,
      usesOutputCols: false,
      usesInputDataframe: true,
      preview: 'highlight rows'
    },
    shortcut: 'fr',
    action: (
      payload: OperationPayload<{
        conditions: {
          condition: string;
          value: string;
        }[];
        action: 'select' | 'drop';
      }>
    ): Source => {
      const where = payload.conditions.map(condition =>
        whereExpression(condition.condition, condition.value, payload.cols[0])
      );

      if (payload.options.preview) {
        const color = payload.action === 'select' ? 'success' : 'error';
        return payload.source.cols.set({
          target: payload.target,
          cols: `__bumblebee__highlight_row__${color}`,
          valueFunc: true,
          evalValue: false,
          where: where.join(' | '),
          default: false
        });
      }

      if (payload.action === 'select') {
        return payload.source.rows.select({
          target: payload.target,
          expr: where.join(' | ')
        });
      } else {
        return payload.source.rows.drop({
          target: payload.target,
          expr: where.join(' | ')
        });
      }
    },
    fields: [
      {
        name: 'conditions',
        label: 'Conditions',
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
                value: 'value_in'
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
            class: 'grouped-first w-1/2'
          },
          {
            name: 'value',
            label: 'Value',
            type: 'string',
            class: 'grouped-last w-1/2'
          }
        ]
      },
      {
        name: 'action',
        label: 'Action',
        type: 'string',
        defaultValue: 'select',
        options: (_payload: Payload) => [
          {
            text: 'Filter matching rows',
            value: 'select'
          },
          {
            text: 'Drop matching rows',
            value: 'drop'
          },
          {
            text: 'Replace matching rows',
            value: 'replace',
            hidden: true // TODO: implement, show in special selection
          }
        ]
      }
    ]
  },
  {
    key: 'Drop duplicated',
    name: 'Drop duplicated rows',
    alias: 'drop rows duplicated',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (
      payload: OperationPayload<{
        keep: 'first' | 'last';
        how: 'any' | 'all';
      }>
    ): Source => {
      return payload.source.rows.dropDuplicated({
        target: payload.target,
        cols: payload.cols,
        keep: payload.keep,
        how: payload.how,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'rdd'
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
    action: (
      payload: OperationPayload<{
        keep: 'first' | 'last';
        how: 'any' | 'all';
      }>
    ): Source => {
      return payload.source.rows.dropDuplicated({
        target: payload.target,
        cols: payload.cols,
        keep: payload.keep,
        how: payload.how,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'rde'
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.lower({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.upper({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.title({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.capitalize({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.normalizeChars({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.removeSpecialChars({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lrs'
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
    action: (
      payload: OperationPayload<{
        start: number;
        end: number;
      }>
    ): Source => {
      return payload.source.cols.substring({
        target: payload.target,
        start: payload.start,
        end: payload.end,
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'le'
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
    action: (
      payload: OperationPayload<{
        start: number;
        end: number;
      }>
    ): Source => {
      return payload.source.cols.trim({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        start: number;
        end: number;
      }>
    ): Source => {
      return payload.source.cols.normalizeSpaces({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        n: number;
      }>
    ): Source => {
      return payload.source.cols.left({
        target: payload.target,
        cols: payload.cols,
        n: payload.n,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lsl'
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
    action: (
      payload: OperationPayload<{
        n: number;
      }>
    ): Source => {
      return payload.source.cols.right({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lsr'
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
    action: (
      payload: OperationPayload<{
        start: number;
        end: number;
      }>
    ): Source => {
      return payload.source.cols.min({
        target: payload.target,
        cols: payload.cols,
        start: payload.start,
        end: payload.end,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lsm'
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
    action: (
      payload: OperationPayload<{
        start: number;
        end: number;
      }>
    ): Source => {
      return payload.source.cols.removeStopWords({
        target: payload.target,
        cols: payload.cols,
        start: payload.start,
        end: payload.end,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lp'
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.abs({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        decimals: number;
      }>
    ): Source => {
      return payload.source.cols.round({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.floor({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.ceil({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.mod({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'nm'
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
    action: (
      payload: OperationPayload<{
        base: number;
      }>
    ): Source => {
      return payload.source.cols.log({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.ln({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        power: number;
      }>
    ): Source => {
      return payload.source.cols.pow({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.sqrt({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.sin({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.cos({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.tan({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.asin({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.acos({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.atan({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.sinh({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.cosh({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.tanh({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.asinh({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.acosh({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.atanh({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        type: unknown;
      }>
    ): Source => {
      const outputFormat = payload.type as { name: string; format: string };
      return payload.source.cols.formatDate({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        type: unknown;
      }>
    ): Source => {
      const outputFormat = payload.type as { name: string; format: string };
      return payload.source.cols.formatDate({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        n: number;
        seed: number;
      }>
    ): Source => {
      return payload.source.cols.atanh({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        strategy: string;
      }>
    ): Source => {
      return payload.source.cols.impute({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        prefix: string;
        drop: boolean;
      }>
    ): Source => {
      return payload.source.cols.oneHotEncode({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.stringToIndex({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.indexToString({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.zScore({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.standardScaler({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.minMaxScaler({
        target: payload.target,
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
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.maxAbsScaler({
        target: payload.target,
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
    action: (
      payload: OperationPayload<{
        start: number;
        end: number;
      }>
    ): Source => {
      return payload.source.cols.removeStopWords({
        target: payload.target,
        cols: payload.cols,
        start: payload.start,
        end: payload.end,
        outputCols: payload.outputCols
      });
    },
    shortcut: 'lrw'
  },
  {
    key: 'unnestColumns',
    name: 'Unnest columns',
    alias: 'Split cols unnest',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true
    },
    action: (
      payload: OperationPayload<{
        separator: string;
      }>
    ): Source => {
      return payload.source.cols.unnest({
        target: payload.target,
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
    validate: (
      payload: OperationPayload<{
        separator: string;
      }>
    ): boolean => {
      if (payload.options.preview) {
        if (payload.cols.length <= 1) {
          throw new PreviewError('At least two columns are required', {
            cause: payload.cols
          });
        }
      }
      return true;
    },
    action: (
      payload: OperationPayload<{
        separator: string;
      }>
    ): Source => {
      const drop = !payload.options.preview;
      return payload.source.cols.nest({
        target: payload.target,
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

const preparePayload = (operation: Operation, payload: Payload): Payload => {
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
    (!payload.cols || (Array.isArray(payload.cols) && payload.cols.length < 1))
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

  return payload;
};

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

  operation.validate = (payload: Payload) => {
    if (operationCreator.validate) {
      payload = preparePayload(operation, payload);
      return operationCreator.validate(payload);
    }
    return true;
  };

  operation.action = (payload: Payload) => {
    payload = preparePayload(operation, payload);
    if (operationCreator.validate?.(payload) === false) {
      throw new Error('Validation failed');
    }
    return operationCreator.action(payload);
  };

  return operation;
};

export const operations = operationCreators.map(operationCreator =>
  createOperation(operationCreator)
);

function whereExpression(
  condition: string,
  value: ArrayOr<BasicType>,
  col: string
): string {
  if (!isNaN(Number(value))) {
    value = Number(value);
    condition = `numeric_${condition}`;
  }
  switch (condition) {
    case 'equal':
      return `df["${col}"]=="${value}"`;
    case 'numeric_equal':
      return `(df["${col}"]==${value}) | (df["${col}"]=="${value}")`;
    case 'not_equal':
      return `df["${col}"]!="${value}"`;
    case 'numeric_not_equal':
      return `(df["${col}"]!=${value}) & (df["${col}"]!="${value}")`;
    case 'value_in':
      value = Array.isArray(value) ? value : [value];
      return `df.mask.value_in("${col}", "${value.join('","')}")`;
    case 'numeric_value_in':
      value = Array.isArray(value) ? value : [value];
      return (
        `df.mask.value_in("${col}", "${value.join('","')}") ` +
        `& df.mask.value_in("${col}", ${value.join(',')})`
      );
    default:
      console.warn('Unknown condition', condition);
  }
  return '';
}

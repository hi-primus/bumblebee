import { AppFunctions } from '@/types/app';
import { Client, Source } from '@/types/blurr';
import { isObject } from '@/types/common';
import {
  Operation,
  OperationCreator,
  OperationOptions,
  Payload
} from '@/types/operations';
import { PRIORITIES } from '@/utils/blurr';

type Cols = string[];

type OperationPayload<
  T extends Record<string, unknown> = Record<string, unknown>
> = {
  blurr: Client;
  source: Source;
  target: string;
  cols: Cols;
  allColumns: Cols;
  outputCols: Cols;
  options: OperationOptions;
  app: AppFunctions;
} & T;

type Name = {
  name: string;
  toString: () => string;
  _blurrMember: 'name';
};

export function Name(name: string): Name {
  const _name = {} as Name;
  _name.name = name;
  _name.toString = () => _name.name;
  _name._blurrMember = 'name';
  return _name;
}

export const operationCreators: Record<string, OperationCreator> = {
  loadFromFile: {
    name: 'Load from file',
    defaultOptions: {
      saveToNewDataframe: true,
      preview: 'whole'
    },
    action: async (
      payload: OperationPayload<{
        url: string;
        nRows?: number;
        file: File;
      }>
    ): Promise<Source> => {
      if (payload.options.preview) {
        payload.nRows = Math.min(payload.nRows || 50, 50);
      }

      if (payload.file) {
        let buffer: ArrayBuffer;
        if (payload.options.preview) {
          const string = await getFirstLines(payload.file);
          buffer = new TextEncoder().encode(string).buffer;
        } else {
          buffer = await payload.file.arrayBuffer();
        }
        const fileName = payload.file.name;

        return payload.blurr.readFile({
          buffer,
          nRows: payload.nRows,
          meta: { file_name: fileName },
          requestOptions: { priority: PRIORITIES.operation }
        });
      }

      if (payload.url) {
        return payload.blurr.readFile({
          url: payload.url,
          nRows: payload.nRows,
          requestOptions: { priority: PRIORITIES.operation }
        });
      }

      throw new Error('No file or url provided.');
    },
    fields: [
      {
        name: 'file',
        label: 'File',
        type: 'file'
      },
      {
        name: 'url',
        label: 'Url',
        type: 'string'
      }
    ],
    shortcut: 'lf'
  },
  saveCsv: {
    name: 'Save to file',
    defaultOptions: {
      oneTime: true,
      usesInputDataframe: true,
      targetType: 'void'
    },
    action: async (payload: OperationPayload): Promise<Source> => {
      const df = payload.source;
      if (!df) {
        throw new Error('No dataframe to save.');
      }
      const arrayBuffer = await df.saveCsv();
      let fileName: string = await df.getMeta('file_name');
      if (!fileName) {
        fileName = 'data.csv';
      }
      fileName = fileName.split('/').pop() || fileName;
      downloadArrayBuffer(arrayBuffer, fileName);
      await new Promise(resolve => setTimeout(resolve, 200));
      payload.app.addToast({
        title: 'File saved',
        type: 'success'
      });
      return df;
    },
    shortcut: 'sf'
  },
  createCol: {
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
          return payload.blurr.runCode(
            `parse('${s.value || ''}', data=False)`,
            {
              priority: PRIORITIES.operationRequirement
            }
          );
        })
      );

      const valueFunc = valueFuncPromise.map(p =>
        p.status === 'fulfilled' ? p.value : null
      );

      let outputCols = payload.sets.map((s, index) => {
        if (s.outputColumn) {
          return s.outputColumn;
        }
        if (s.value) {
          return s.value
            .replace(/\s/g, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/^_+|_+$/g, '');
        }
        return `new_column_${index}`;
      });

      if (payload.options.preview) {
        outputCols = outputCols.map(c => `__bumblebee__preview__${c}`);
      }

      const inputColumns = payload.allColumns.filter(col => {
        return valueFunc.some(f => f && f.includes(col));
      });

      const result = payload.source.cols.set({
        target: payload.target,
        cols: outputCols,
        valueFunc,
        evalValue: true,
        evalVariables: {
          parsed_function: Name('parsed_function')
        },
        requestOptions: { priority: PRIORITIES.operation }
      });

      if (inputColumns.length > 0) {
        let movedResult = result;

        if (payload.options.preview) {
          movedResult = movedResult.cols.move({
            column: inputColumns,
            position: 'beginning',
            requestOptions: { priority: PRIORITIES.operation }
          });
        }

        const lastInputColumn = inputColumns[inputColumns.length - 1];

        movedResult = movedResult.cols.move({
          column: outputCols,
          position: 'after',
          refCol: lastInputColumn,
          requestOptions: { priority: PRIORITIES.operation }
        });

        if (payload.options.preview) {
          return movedResult.cols.rename({
            cols: inputColumns,
            outputCols: inputColumns.map(
              c => `__bumblebee__highlight_col__${c}`
            )
          });
        }
        return movedResult;
      }
      return result;
    },
    fields: [
      {
        name: 'sets',
        label: 'Columns',
        type: 'group',
        groupConnector: '',
        fields: [
          {
            name: 'outputColumn',
            label: 'New column name',
            type: 'string',
            defaultValue: ''
            // class: 'grouped-first w-1/3'
          },
          {
            name: 'value',
            label: 'Formula',
            placeholder: 'Formula or "value"',
            class: 'field-mono w-full',
            type: 'string',
            // class: 'grouped-last w-2/3',
            suggestions: (payload: Payload) => {
              return (
                payload.allColumns
                  ?.filter((c: unknown) => c && typeof c === 'string')
                  .map((c: string) => {
                    return {
                      value: c,
                      name: c,
                      type: 'column'
                    };
                  }) || []
              );
            }
          }
        ]
      }
    ],
    shortcut: 'cc'
  },
  setCol: {
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
          otherValue: string;
          values: string[];
          replaceBy: string;
        }[];
        otherwise: string;
      }>
    ): Source => {
      const where = payload.replaces
        .map(replace =>
          whereExpression(replace.condition, replace, payload.cols[0])
        )
        .filter(expression => expression);

      const result = payload.source.cols.set({
        target: payload.target,
        cols: payload.outputCols,
        valueFunc: payload.replaces.map(r => r.replaceBy),
        evalValue: false,
        where,
        default: payload.otherwise || null,
        evalVariables: {
          parsed_function: Name('parsed_function')
        },
        requestOptions: { priority: PRIORITIES.operation }
      });

      if (payload.outputCols[0] !== payload.cols[0]) {
        return result.cols.move({
          column: payload.outputCols,
          position: 'after',
          refCol: payload.cols[0],
          requestOptions: { priority: PRIORITIES.operation }
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
              { divider: true },
              {
                text: 'Less than',
                value: 'less_than'
              },
              {
                text: 'Less than or equal to',
                value: 'less_than_equal'
              },
              {
                text: 'Greater than',
                value: 'greater_than'
              },
              {
                text: 'Greater than or equal to',
                value: 'greater_than_equal'
              },
              {
                text: 'Is Between',
                value: 'between'
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
              switch (condition) {
                case 'value_in':
                  return 'w-full';
                case 'between':
                  return 'grouped-first w-1/4';
                default:
                  return 'grouped-first w-1/3';
              }
            }
          },
          {
            name: 'value',
            label: (payload: Payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              switch (condition) {
                case 'between':
                  return 'Min';
                case 'match_pattern':
                  return 'Pattern';
                case 'where':
                  return 'Expression';
                default:
                  return 'Value';
              }
            },
            type: 'string',
            class: (payload: Payload, currentIndex = 0): string => {
              const condition = payload.replaces[currentIndex].condition;
              switch (condition) {
                case 'between':
                  return 'grouped-middle w-1/4';
                default:
                  return 'grouped-middle w-1/3';
              }
            },
            hidden: (payload: Payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              return condition === 'value_in';
            }
          },
          {
            name: 'otherValue',
            label: 'Max',
            type: 'string',
            class: 'grouped-middle w-1/4',
            hidden: (payload: Payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              return condition !== 'between';
            }
          },
          {
            name: 'values',
            label: 'Values',
            type: 'strings array',
            defaultValue: [],
            class: 'w-full',
            hidden: (payload: Payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              return condition !== 'value_in';
            }
          },
          {
            name: 'replaceBy',
            label: 'Replace by',
            type: 'string',
            class: (payload: Payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              switch (condition) {
                case 'value_in':
                  return 'w-full';
                case 'between':
                  return 'grouped-last w-1/4';
                default:
                  return 'grouped-last w-1/3';
              }
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
  replace: {
    name: 'Replace in column values',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    validate: (
      payload: OperationPayload<{
        replaces: {
          search: string;
          replaceBy: string;
        }[];
        searchBy: string;
        matchCase: OperationOptions;
      }>
    ) => {
      const validReplaces = payload.replaces.filter(
        r => r.search && r.replaceBy !== undefined
      );
      if (validReplaces.length > 0) {
        return true;
      }
      throw new PreviewError('Add at least one valid replace');
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
      const validReplaces = payload.replaces.filter(
        r => r.search && r.replaceBy !== undefined
      );

      const result = payload.source.cols.replace({
        target: payload.target,
        cols: payload.cols,
        search: validReplaces.map(replace => replace.search),
        replaceBy: validReplaces.map(replace => replace.replaceBy),
        searchBy: payload.searchBy,
        ignoreCase: !payload.matchCase,
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
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
            class: 'grouped-last w-1/2',
            defaultValue: ''
          }
        ]
      },
      {
        name: 'searchBy',
        label: 'Search by',
        type: 'string',
        defaultValue: 'chars',
        options: [
          {
            text: 'Contains characters',
            value: 'chars'
          },
          {
            text: 'Contains words',
            value: 'words'
          },
          {
            text: 'Exact match',
            value: 'full'
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
  filterRows: {
    name: 'Filter rows',
    title: payload =>
      payload.selectionFromPlot ? 'Filter / Set values' : 'Filter rows',
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
          otherValue: string;
          values: string[];
        }[];
        action: 'select' | 'drop' | 'set';
        value: string;
        otherwise: string;
      }>
    ): Source => {
      const where = payload.conditions
        .map(condition =>
          whereExpression(condition.condition, condition, payload.cols[0])
        )
        .filter(expression => expression);

      if (payload.options.preview) {
        const color = payload.action === 'drop' ? 'error' : 'success';

        const highlightColumn = `__bumblebee__highlight_row__${color}`;

        const result = payload.source.cols.set({
          target: payload.target,
          cols: highlightColumn,
          valueFunc: true,
          evalValue: false,
          where: where.join(' | '),
          default: false,
          evalVariables: {
            parsed_function: Name('parsed_function')
          },
          requestOptions: { priority: PRIORITIES.operation }
        });

        if (payload.action === 'set') {
          const outputCols = payload.cols.map(
            col => `__bumblebee__preview__${col}`
          );
          return result.cols
            .set({
              target: payload.target,
              cols: outputCols,
              valueFunc: payload.value,
              evalValue: false,
              where: `df['${highlightColumn}']`,
              default: payload.otherwise,
              evalVariables: {
                parsed_function: Name('parsed_function')
              },
              requestOptions: { priority: PRIORITIES.operation }
            })
            .cols.move({
              column: outputCols,
              position: 'after',
              refCol: payload.cols[0]
            });
        }

        return result;
      }

      switch (payload.action) {
        case 'select':
          return payload.source.rows.select({
            target: payload.target,
            expr: where.join(' | '),
            requestOptions: { priority: PRIORITIES.operation }
          });
        case 'drop':
          return payload.source.rows.drop({
            target: payload.target,
            expr: where.join(' | '),
            requestOptions: { priority: PRIORITIES.operation }
          });
        case 'set':
          return payload.source.cols.set({
            target: payload.target,
            cols: payload.cols,
            valueFunc: payload.value,
            evalValue: false,
            where: where.join(' | '),
            default: payload.otherwise,
            evalVariables: {
              parsed_function: Name('parsed_function')
            },
            requestOptions: { priority: PRIORITIES.operation }
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
              { divider: true },
              {
                text: 'Less than',
                value: 'less_than'
              },
              {
                text: 'Less than or equal to',
                value: 'less_than_equal'
              },
              {
                text: 'Greater than',
                value: 'greater_than'
              },
              {
                text: 'Greater than or equal to',
                value: 'greater_than_equal'
              },
              {
                text: 'Is Between',
                value: 'between'
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
            class: (payload: Payload, currentIndex = 0): string => {
              const condition = payload.conditions[currentIndex].condition;
              switch (condition) {
                case 'value_in':
                  return 'w-full';
                default:
                  return 'grouped-first w-1/2';
              }
            }
          },
          {
            name: 'value',
            label: (payload: Payload, currentIndex = 0): string => {
              const condition = payload.conditions[currentIndex].condition;
              switch (condition) {
                case 'between':
                  return 'Min';
                default:
                  return 'Value';
              }
            },
            type: 'string',
            class: (payload: Payload, currentIndex = 0): string => {
              const condition = payload.conditions[currentIndex].condition;
              switch (condition) {
                case 'between':
                  return 'grouped-middle w-1/4';
                default:
                  return 'grouped-last w-1/2';
              }
            },
            hidden: (payload: Payload, currentIndex = 0) => {
              const condition = payload.conditions[currentIndex].condition;
              return condition === 'value_in';
            }
          },
          {
            name: 'otherValue',
            label: 'Max',
            type: 'string',
            class: 'grouped-last w-1/4',
            hidden: (payload: Payload, currentIndex = 0) => {
              const condition = payload.conditions[currentIndex].condition;
              return condition !== 'between';
            }
          },
          {
            name: 'values',
            label: 'Values',
            type: 'strings array',
            defaultValue: [],
            class: 'w-full',
            hidden: (payload: Payload, currentIndex = 0) => {
              console.log('payload', payload);
              const condition = payload.conditions[currentIndex].condition;
              return condition !== 'value_in';
            }
          }
        ]
      },
      {
        name: 'action',
        label: 'Action',
        type: 'string',
        defaultValue: 'select',
        options: (payload: Payload) => [
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
            value: 'set',
            hidden: !payload.selectionFromPlot
          }
        ]
      },
      {
        name: 'value',
        label: 'Value',
        type: 'string',
        hidden: (payload: Payload) => payload.action !== 'set'
      },
      {
        name: 'otherwise',
        label: 'Otherwise',
        type: 'string',
        hidden: (payload: Payload) => payload.action !== 'set'
      }
    ]
  },
  dropDuplicated: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'rdd'
  },
  dropEmpty: {
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
        how: payload.how,
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'rde'
  },
  // Columns operations
  keep: {
    name: 'Keep selected columns',
    alias: 'keep columns',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true
    },
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.keep({
        target: payload.target,
        cols: payload.cols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'kc'
  },
  drop: {
    name: 'Drop selected columns',
    alias: 'drop columns',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true
    },
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.drop({
        target: payload.target,
        cols: payload.cols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'dc'
  },
  lower: {
    name: 'Lowercase column values',
    alias: 'Lowercase letters lower case',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.lower({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'll'
  },
  upper: {
    name: 'Uppercase column values',
    alias: 'Uppercase letters upper case',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.upper({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'ul'
  },
  title: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tl'
  },
  capitalize: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'cl'
  },
  removeAccents: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'lra'
  },
  removeSpecialChars: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'lrs'
  },
  extract: {
    name: 'Extract a substring from column values',
    alias: 'Extract substring sub string',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'le'
  },
  trim: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'lt'
  },
  normalize: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'lns'
  },
  left: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    fields: [
      {
        name: 'n',
        label: 'Number of characters',
        type: 'number'
      }
    ],
    shortcut: 'lsl'
  },
  right: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    fields: [
      {
        name: 'n',
        label: 'Number of characters',
        type: 'number'
      }
    ],
    shortcut: 'lsr'
  },
  mid: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      }) as Source;
    },
    fields: [
      {
        name: 'start',
        label: 'Start index',
        type: 'number'
      },
      {
        name: 'end',
        label: 'End index',
        type: 'number'
      }
    ],
    shortcut: 'lsm'
  },
  pad: {
    name: 'Add padding characters',
    alias: 'padding fill length',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (
      payload: OperationPayload<{
        width: number;
        side: 'left' | 'right' | 'both';
        fillChar: string;
      }>
    ): Source => {
      return payload.source.cols.pad({
        target: payload.target,
        cols: payload.cols,
        width: payload.width,
        side: payload.side,
        fillChar: payload.fillChar,
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    fields: [
      {
        name: 'width',
        label: 'Width',
        type: 'number'
      },
      {
        name: 'side',
        label: 'Side',
        type: 'string',
        defaultValue: 'left',
        options: [
          {
            text: 'Left',
            value: 'left'
          },
          {
            text: 'Right',
            value: 'right'
          },
          {
            text: 'Both',
            value: 'both'
          }
        ]
      },
      {
        name: 'fillChar',
        label: 'Fill character',
        type: 'string',
        defaultValue: ' '
      }
    ],
    shortcut: 'lp'
  },

  // Numeric
  absoluteValue: {
    name: 'Absolute Value from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'na'
  },
  round: {
    name: 'Round Number from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'nr'
  },
  floor: {
    name: 'Floor Number from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'nf'
  },
  ceil: {
    name: 'Ceil from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'nc'
  },
  modulo: {
    name: 'Modulo from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'nm'
  },
  logarithm: {
    name: 'Logarithm from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'nl'
  },
  naturalLogarithm: {
    name: 'natural Logarithm from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'nnl'
  },
  power: {
    name: 'power from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'np'
  },
  square: {
    name: 'Square Root from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'np'
  },
  // Trigonometrics
  sin: {
    name: 'Sine from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'ts'
  },
  cos: {
    name: 'Cosine from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tc'
  },
  tan: {
    name: 'Tangent from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tt'
  },
  asin: {
    name: 'Inverse sine from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tas'
  },
  acos: {
    name: 'Inverse cosine from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tac'
  },
  atan: {
    name: 'Inverse tangent from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tat'
  },
  sinh: {
    name: 'Hyperbolic sine from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tsh'
  },
  cosh: {
    name: 'Hyperbolic cosine from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tch'
  },
  tanh: {
    name: 'Hyperbolic tangent from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tth'
  },
  asinh: {
    name: 'Inverse hyperbolic sine from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tash'
  },
  acosh: {
    name: 'Inverse hyperbolic cosine from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tach'
  },
  atanh: {
    name: 'Inverse hyperbolic tangent from column values',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'tath'
  },
  // Date/Time Functions
  extractFromDate: {
    name: 'Extract part of a date from a column',
    alias: 'extract date year month day hour minute second',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (
      payload: OperationPayload<{
        type: unknown;
        currentFormat: string;
      }>
    ): Source => {
      const outputFormat = payload.type as { name: string; format: string };
      return payload.source.cols.formatDate({
        target: payload.target,
        cols: payload.cols,
        outputFormat,
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
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
  getTime: {
    // TODO: Implement this
    name: 'Get time from a column',
    alias: 'get time between',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
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
  sample: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'ms'
  },
  impute: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
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
  oneHotEncoding: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'mo'
  },
  stringToIndex: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'msi'
  },
  indexToString: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'mis'
  },
  zScore: {
    name: 'Z-score in a column',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'msi'
  },
  standardScaler: {
    name: 'standard scaler in a column',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'mss'
  },
  minMaxScaler: {
    name: 'Min max scaler in a column',
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'mmms'
  },
  maxAbsScaler: {
    name: 'MaxAbs scaler in a column',
    alias: 'max abs maxabs scaler',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.maxAbsScaler({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'mmas'
  },

  //
  removeStopWords: {
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
        outputCols: payload.outputCols,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    shortcut: 'lrw'
  },
  unnestColumns: {
    name: 'Unnest columns',
    alias: 'Split cols unnest',
    defaultOptions: {
      usesInputCols: 'single',
      usesInputDataframe: true,
      preview: true
    },
    action: (
      payload: OperationPayload<{
        separator: string;
        splits: number;
        drop: boolean;
      }>
    ): Source => {
      const outputCols = payload.options.preview
        ? '__bumblebee__preview__' + payload.cols[0]
        : payload.outputCols;

      return payload.source.cols.unnest({
        target: payload.target,
        cols: payload.cols[0],
        outputCols,
        separator: payload.separator,
        splits: payload.splits === undefined ? 2 : payload.splits,
        drop: payload.options.preview ? false : payload.drop,
        requestOptions: { priority: PRIORITIES.operation }
      });
    },
    fields: [
      {
        name: 'separator',
        label: 'Separator',
        type: 'string'
      },
      {
        name: 'splits',
        label: 'Splits',
        type: 'number',
        defaultValue: 2
      },
      {
        name: 'drop',
        label: 'Drop',
        type: 'boolean',
        defaultValue: false
      }
    ],
    shortcut: 'cu'
  },
  nestColumns: {
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
    ) => {
      if (payload.cols.length <= 1) {
        throw new PreviewError('At least two columns are required', {
          cause: payload.cols
        });
      }
      return true;
    },
    action: (
      payload: OperationPayload<{
        separator: string;
      }>
    ): Source => {
      const drop = !payload.options.preview;
      const outputCol = payload.options.preview
        ? `__bumblebee__preview__${payload.cols.join('_')}`
        : payload.cols.join('_');
      return payload.source.cols.nest({
        target: payload.target,
        cols: payload.cols,
        outputCol,
        separator: payload.separator,
        drop,
        requestOptions: { priority: PRIORITIES.operation }
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
};

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
    const foundOperation = operationCreators[operationCreator.uses];
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

export const operations: Record<string, Operation> = objectMap(
  operationCreators,
  createOperation
);

function whereExpression(
  condition: string,
  payload: {
    value: BasicType;
    otherValue: BasicType;
    values: BasicType[];
  },
  col: string
): string {
  let { value, otherValue, values } = payload;

  const isNumeric = !isNaN(Number(value));

  if (isNumeric && ['equal', 'not_equal'].includes(condition)) {
    value = Number(value);
    condition = `numeric_${condition}`;
  }

  if (
    !isNumeric &&
    [
      'greater_than',
      'less_than',
      'greater_than_equal',
      'less_than_equal',
      'between'
    ].includes(condition)
  ) {
    return '';
  }

  switch (condition) {
    case 'equal':
      return `(df["${col}"]=="${value}")`;
    case 'numeric_equal':
      return `(df["${col}"]==${value}) | (df["${col}"]=="${value}")`;
    case 'not_equal':
      return `(df["${col}"]!="${value}")`;
    case 'numeric_not_equal':
      return `(df["${col}"]!=${value}) & (df["${col}"]!="${value}")`;
    case 'value_in':
      if (!Array.isArray(values)) {
        console.warn(
          `Values must be an array, got ${typeof values}, ${values}}`
        );
        values = values === undefined ? [] : [values];
      }
      values = values
        .map(v => (isNaN(Number(v)) ? [`"${v}"`] : [`"${v}"`, Number(v)]))
        .flat(1);

      if (!values.length) {
        return '';
      }

      return `df.mask.value_in("${col}", [${values.join(',')}])`;

    case 'greater_than':
      return `(df["${col}"]>${value})`;
    case 'less_than':
      return `(df["${col}"]<${value})`;
    case 'greater_than_equal':
      return `(df["${col}"]>=${value})`;
    case 'less_than_equal':
      return `(df["${col}"]<=${value})`;
    case 'between':
      if (isNaN(Number(otherValue))) {
        return '';
      }
      return `(df["${col}"]>=${value}) & (df["${col}"]<=${otherValue})`;
    default:
      console.warn('Unknown condition', condition);
  }
  return '';
}

const getFirstLines = (
  file: File,
  minLines = 15,
  maxLines = 50,
  maxSize = 8192
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    let lineCount = 0;
    let readCount = 0;
    let fileContent = '';
    let lineContent = '';
    const chunkSize = 1024;

    const readChunk = function () {
      const chunk = file.slice(readCount, readCount + chunkSize);
      reader.readAsText(chunk);
    };

    const onLoad = function (event: ProgressEvent<FileReader>) {
      const data = event.target?.result as string;
      readCount += chunkSize;

      if (!data || !data?.length) {
        return;
      }

      let aborted = false;

      for (let i = 0; i < data?.length; i++) {
        lineContent += data.charAt(i);
        // doesn't add the last line if it doesn't end with a new line
        if (data.charAt(i) === '\n') {
          fileContent += lineContent;
          lineContent = '';
          lineCount++;
          if (lineCount >= maxLines) {
            reader.abort();
            aborted = true;
            break;
          }
        }
      }

      if (
        readCount >= file.size ||
        lineCount >= maxLines ||
        (readCount >= maxSize && lineCount >= minLines)
      ) {
        if (!aborted) {
          reader.abort();
        }
        reader.removeEventListener('load', onLoad);
        reader.removeEventListener('error', onLoad);
        resolve(fileContent);
      } else {
        readChunk();
      }
    };

    reader.addEventListener('load', onLoad);

    reader.addEventListener('error', function () {
      reject(new Error('Error reading file.'));
    });

    readChunk();
  });
};

function downloadArrayBuffer(arrayBuffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([arrayBuffer], { type: 'text/csv' });
  const link = document.createElement('a');
  const url = window.URL.createObjectURL(blob);
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

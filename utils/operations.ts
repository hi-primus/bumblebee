import { Source } from '@/types/blurr';
import { isObject } from '@/types/common';
import {
  Cols,
  JoinData,
  Operation,
  OperationCreator,
  OperationOptions,
  OperationPayload,
  Payload,
  PayloadWithOptions
} from '@/types/operations';
import { capitalize, naturalJoin } from '@/utils';
import { PRIORITIES } from '@/utils/blurr';

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

const inDataframeContent = (payload: OperationPayload): string => {
  return `df{ \nin rd{dn{${payload.source.name}}}}`;
};

const inColsContent = (
  payload: OperationPayload,
  includeDataframe = true
): string => {
  let str =
    (payload.cols?.length || 0) > 0
      ? ` \nin bl{${naturalJoin(payload.cols)}}`
      : '';

  if (
    payload.options.usesOutputCols &&
    (payload.outputCols?.length || 0) > 0 &&
    payload.outputCols.join('') !== '' &&
    payload.outputCols.join(' ') !== payload.cols?.join(' ')
  ) {
    str += ` \nto bl{${naturalJoin(payload.outputCols)}}`;
  }

  if (includeDataframe) {
    str += inDataframeContent(payload);
  }

  return str;
};

const defaultContentFunction = (name: string, connector = '') => {
  const prefix = name.startsWith('Get ')
    ? 'Get '
    : name.startsWith('Apply ')
    ? 'Apply '
    : '';
  if (prefix) {
    name = name.slice(prefix.length);
  }
  return (payload: OperationPayload): string => {
    return (
      prefix +
      `b{${name}} ` +
      (connector ? `${connector} ` : '') +
      inColsContent(payload)
    );
  };
};

export const operationCreators: Record<string, OperationCreator> = {
  loadFromFile: {
    name: 'Load from file',
    defaultOptions: {
      saveToNewDataframe: 'required',
      preview: 'whole'
    },
    content: (payload: { url: string; file: File }) => {
      if (payload.file?.name) {
        return `b{Load} gr{${payload.file.name}} file`;
      } else {
        const fileName = payload.url?.split('/').pop();
        return `b{Load} gr{${fileName}} file from url`;
      }
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
        if (payload.requestOptions.getCode) {
          return payload.blurr.readFile({
            target: payload.target,
            url: payload.file.name,
            nRows: payload.nRows,
            requestOptions: payload.requestOptions
          });
        }

        let buffer: ArrayBuffer;
        if (payload.options.preview) {
          const string = await getFirstLines(payload.file);
          buffer = new TextEncoder().encode(string).buffer;
        } else {
          buffer = await payload.file.arrayBuffer();
        }
        const fileName = payload.file.name;

        return payload.blurr.readFile({
          target: payload.target,
          buffer,
          nRows: payload.nRows,
          meta: { file_name: fileName },
          requestOptions: payload.requestOptions
        });
      }

      if (payload.url) {
        return payload.blurr.readFile({
          target: payload.target,
          url: payload.url,
          nRows: payload.nRows,
          requestOptions: payload.requestOptions
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
        type: 'success',
        time: 10
      });
      return df;
    },
    shortcut: 'sf'
  },
  join: {
    name: 'Join dataframes',
    defaultOptions: {
      usesInputDataframe: true,
      preview: 'whole',
      targetType: 'dataframe'
    },
    content: (
      payload: OperationPayload<{
        dfRightName: string;
        how: 'left' | 'right' | 'inner' | 'outer';
        columns: JoinData;
      }>
    ) => {
      const foundDf = payload.allDataframes.find(
        df => df.df.name === payload.source.name
      );
      const dfName = foundDf?.name || `dn{${payload.source.name}}`;
      const str = `b{Join} rd{${dfName}} and rd{${payload.dfRightName}} dataframes using \ngr{${payload.how}} join`;

      const leftOn = payload.columns.left?.find(col => col.isKey)?.name;
      const rightOn = payload.columns.right?.find(col => col.isKey)?.name;

      if (leftOn === rightOn) {
        return `\n${str} and gr{${leftOn}} as join key`;
      } else {
        return `\n${str} and gr{${leftOn}} as left join key and \ngr{${rightOn}} as right join key`;
      }
    },
    action: async (
      payload: OperationPayload<{
        dfRightName: string;
        how: 'left' | 'right' | 'inner' | 'outer';
        columns: JoinData;
      }>
    ): Promise<Source> => {
      const foundDf = payload.allDataframes.find(
        df => df.name === payload.dfRightName
      );

      if (!foundDf) {
        throw new Error(
          `Dataframe with name '${payload.dfRightName}' not found.`
        );
      }

      let dfRight = foundDf?.df;

      let df = payload.source;

      let upperBound = 64;

      const dfRowsCount = await df.rows.count({
        requestOptions: payload.requestOptions
      });

      const dfRightRowsCount = await dfRight.rows.count({
        requestOptions: payload.requestOptions
      });

      const minRows = Math.ceil(
        Math.min(25, Math.max(dfRowsCount * 0.75, dfRightRowsCount * 0.75))
      );

      const maxSampleSize = Math.min(
        Math.max(dfRowsCount, dfRightRowsCount),
        32768
      );

      const leftOn = payload.columns.left.find(col => col.isKey)?.name;
      const rightOn = payload.columns.right.find(col => col.isKey)?.name;

      // loop until the dataframe is big enough to show the preview

      while (true) {
        if (payload.options.preview) {
          // Use just a part of the dataframe on preview
          df = payload.source.cols
            .select({
              target: payload.target,
              cols: payload.columns.left
                .filter(c => c.selected)
                .map(c => c.name)
            })
            .iloc({
              target: payload.target,
              lower_bound: 0,
              upper_bound: upperBound
            });
          dfRight = await dfRight.cols
            .select({
              target: 'preview_df_right',
              cols: payload.columns.right
                .filter(c => c.selected)
                .map(c => c.name)
            })
            .iloc({
              target: 'preview_df_right',
              lower_bound: 0,
              upper_bound: upperBound
            });
        }

        df = await df.cols.join({
          target: payload.target,
          dfRight,
          how: payload.how,
          leftOn,
          rightOn,
          requestOptions: payload.requestOptions
        });

        // break if it's not a preview

        if (!payload.options.preview) {
          break;
        }

        // break if the dataframe is big enough to show the preview

        const rowsCount = await df.rows.count({
          requestOptions: payload.requestOptions
        });

        if (rowsCount < minRows && upperBound < maxSampleSize) {
          upperBound *= 8;
        } else {
          break;
        }
      }

      const resultColumns = await df.cols.names({
        requestOptions: payload.requestOptions
      });

      const leftColumns = payload.allColumns.filter(
        col => leftOn !== col && resultColumns.includes(col)
      );

      const rightColumns = foundDf.columns.filter(
        col => rightOn !== col && resultColumns.includes(col)
      );

      const middleColumns = resultColumns.filter(
        col => !leftColumns.includes(col) && !rightColumns.includes(col)
      );

      if (payload.options.preview) {
        const leftColumnsRenamed = leftColumns.map(
          col => `__bumblebee__highlight_col__${col}`
        );

        const middleColumnsRenamed = middleColumns.map(
          col => `__bumblebee__highlight_col__secondary__${col}`
        );

        const rightColumnsRenamed = rightColumns.map(
          col => `__bumblebee__highlight_col__tertiary__${col}`
        );

        return df.cols
          .rename({
            cols: [...leftColumns, ...rightColumns, ...middleColumns],
            outputCols: [
              ...leftColumnsRenamed,
              ...rightColumnsRenamed,
              ...middleColumnsRenamed
            ],
            requestOptions: payload.requestOptions
          })
          .cols.select({
            cols: [
              ...leftColumnsRenamed,
              ...middleColumnsRenamed,
              ...rightColumnsRenamed
            ],
            requestOptions: payload.requestOptions
          });
      } else {
        return df.cols.select({
          cols: [...leftColumns, ...middleColumns, ...rightColumns],
          requestOptions: payload.requestOptions
        });
      }
    },
    codeExport: (
      payload: OperationPayload<{
        dfRightName: string;
        how: 'left' | 'right' | 'inner' | 'outer';
        columns: JoinData;
      }>
    ) => {
      const leftColumns = payload.columns.left
        .filter(c => c.selected)
        .map(c => c.name);
      const rightColumns = payload.columns.right
        .filter(c => c.selected)
        .map(c => c.name);
      const leftOn = payload.columns.left.find(c => c.isKey)?.name;
      const rightOn = payload.columns.right.find(c => c.isKey)?.name;

      const dfRightName =
        payload.allDataframes.find(df => df.name === payload.dfRightName)?.df
          ?.name || 'df_right';

      return (
        `${payload.target} = ` +
        `${payload.source?.name}.cols.select(${pythonArguments({
          cols: leftColumns
        })})` +
        `.cols.join(${pythonArguments({
          df_right: Name(
            `${dfRightName}.cols.select(${pythonArguments({
              cols: rightColumns
            })})`
          ),
          how: payload.how,
          left_on: leftOn,
          right_on: rightOn
        })})`
      );
    },
    fields: [
      {
        name: 'dfRightName',
        label: 'Dataframe',
        type: 'string',
        defaultValue: payload => payload.otherDataframes[0]?.name,
        options: payload => {
          return (
            payload.otherDataframes?.map(df => ({
              text: df.name,
              value: df.name
            })) || []
          );
        }
      },
      {
        name: 'how',
        label: 'How',
        type: 'string',
        defaultValue: 'inner',
        options: [
          { text: 'Left', value: 'left' },
          { text: 'Right', value: 'right' },
          { text: 'Inner', value: 'inner' },
          { text: 'Outer', value: 'outer' }
        ]
      },
      {
        name: 'columns',
        type: 'join'
      }
    ],
    shortcut: 'jd'
  },
  createCol: {
    name: 'Create new column',
    defaultOptions: {
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: (
      payload: OperationPayload<{
        sets: {
          outputColumn: string;
          value: string;
        }[];
      }>
    ) => {
      const str =
        payload.sets.length > 1 ? 'b{Create columns}' : 'b{Create column}';
      const sets = payload.sets.map((s, index) => {
        let columnName: string;
        if (s.outputColumn) {
          columnName = s.outputColumn;
        } else if (s.value) {
          columnName = s.value
            .replace(/\s/g, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/^_+|_+$/g, '');
        } else {
          columnName = `new_column_${index}`;
        }
        return `\nbl{${columnName}} with value gr{${s.value}}`;
      });
      return `${str} ${naturalJoin(sets)}` + inDataframeContent(payload);
    },
    action: (
      payload: OperationPayload<{
        sets: {
          outputColumn: string;
          value: string;
        }[];
      }>
    ): Source => {
      const valueFunc = payload.sets.map(s =>
        s.value ? Name(`parse('${s.value}', data=False)`) : '""'
      ); // empty expression

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
        return valueFunc.some(s => s?.toString && s.toString().includes(col));
      });

      const result = payload.source.cols.set({
        target: payload.target,
        cols: outputCols,
        valueFunc,
        evalValue: true,
        evalVariables: {
          parsed_function: Name('parsed_function')
        },
        requestOptions: inputColumns.length === 0 ? payload.requestOptions : {}
      });

      if (inputColumns.length > 0) {
        let movedResult = result;

        if (payload.options.preview) {
          movedResult = movedResult.cols.move({
            target: payload.target,
            column: inputColumns,
            position: 'beginning'
          });
        }

        const lastInputColumn = inputColumns[inputColumns.length - 1];

        movedResult = movedResult.cols.move({
          target: payload.target,
          column: outputCols,
          position: 'after',
          refCol: lastInputColumn,
          requestOptions: !payload.options.preview ? payload.requestOptions : {}
        });

        if (payload.options.preview) {
          return movedResult.cols.rename({
            target: payload.target,
            cols: inputColumns,
            outputCols: inputColumns.map(
              c => `__bumblebee__highlight_col__${c}`
            ),
            requestOptions: payload.requestOptions
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
              return payload.allColumns.map((c: string) => {
                return {
                  value: c,
                  name: c,
                  type: 'column'
                };
              });
            }
          }
        ]
      }
    ],
    shortcut: 'nc'
  },
  setCol: {
    name: 'Set column',
    defaultOptions: {
      usesInputCols: 'single',
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: (
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
    ) => {
      let str = 'b{Set column}';
      const sets = payload.replaces.map(s => {
        const fromWhere = whereHint(s.condition, s);
        if (fromWhere) {
          return `to gr{${s.replaceBy}} if bl{${payload.cols[0]}} ${fromWhere}`;
        }
        if (s.value) {
          return `to gr{${s.value}}`;
        }
        return `to gr{${s.values.join(', ')}}`;
      });
      str += ` ${sets.join(', ')}`;
      if (payload.otherwise) {
        str += ` otherwise, with gr{${payload.otherwise}}`;
      }
      return str + inDataframeContent(payload);
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
      let where = payload.replaces.map(r =>
        whereExpression(r.condition, r, payload.cols[0])
      );

      const replaces = payload.replaces
        .filter((_r, index) => {
          return where[index];
        })
        .map(r => r.replaceBy);

      where = where.filter(w => w);

      let df: Source = payload.source;

      if (payload.options.preview) {
        df = df.cols.copy({
          target: payload.target,
          cols: payload.cols,
          outputCols: payload.outputCols
        });
      }

      const moveColumns =
        payload.outputCols?.[0] && payload.outputCols[0] !== payload.cols[0];

      df = df.cols.set({
        target: payload.target,
        cols: payload.outputCols,
        valueFunc: replaces,
        evalValue: false,
        where,
        default: payload.otherwise || null,
        evalVariables: {
          parsed_function: Name('parsed_function')
        },
        requestOptions: !moveColumns ? payload.requestOptions : {}
      });

      if (moveColumns) {
        return df.cols.move({
          target: payload.target,
          column: payload.outputCols,
          position: 'after',
          refCol: payload.cols[0],
          requestOptions: payload.requestOptions
        });
      }

      return df;
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
            options: _payload => [
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
              { divider: true },
              {
                text: 'Matches values',
                value: 'match'
              },
              {
                text: 'Mismatches values',
                value: 'mismatch'
              },
              { text: 'Missing values', value: 'missing' }
            ],
            class: (payload, currentIndex = 0) => {
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
            label: (payload, currentIndex = 0) => {
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
            class: (payload, currentIndex = 0): string => {
              const condition = payload.replaces[currentIndex].condition;
              switch (condition) {
                case 'between':
                  return 'grouped-middle w-1/4';
                default:
                  return 'grouped-middle w-1/3';
              }
            },
            hidden: (payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              return ['value_in', 'match', 'mismatch', 'missing'].includes(
                condition
              );
            }
          },
          {
            name: 'otherValue',
            label: 'Max',
            type: 'string',
            class: 'grouped-middle w-1/4',
            hidden: (payload, currentIndex = 0) => {
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
            hidden: (payload, currentIndex = 0) => {
              const condition = payload.replaces[currentIndex].condition;
              return condition !== 'value_in';
            }
          },
          {
            name: 'replaceBy',
            label: 'Replace by',
            type: 'string',
            class: (payload, currentIndex = 0) => {
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
    content: (
      payload: OperationPayload<{
        replaces: {
          search: string;
          replaceBy: string;
        }[];
        searchBy: string;
        matchCase: OperationOptions;
      }>
    ) => {
      const replaces = payload.replaces.map(
        r => `\ngr{${r.search}} by gr{${r.replaceBy}}`
      );
      return `b{Replace} ${naturalJoin(replaces)}${inColsContent(payload)}`;
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
      throw new Error('Add at least one valid replace');
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

      const moveColumns =
        payload.outputCols?.[0] && payload.outputCols[0] !== payload.cols[0];

      const result = payload.source.cols.replace({
        target: payload.target,
        cols: payload.cols,
        search: validReplaces.map(replace => replace.search),
        replaceBy: validReplaces.map(replace => replace.replaceBy),
        searchBy: payload.searchBy,
        ignoreCase: !payload.matchCase,
        outputCols: payload.outputCols,
        requestOptions: !moveColumns ? payload.requestOptions : {}
      });

      if (moveColumns) {
        return result.cols.move({
          column: payload.outputCols[0],
          position: 'after',
          refCol: payload.cols[0],
          requestOptions: payload.requestOptions
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
  sortRows: {
    name: 'Sort rows',
    alias: 'reorder rows',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'whole no-profile',
      usesOutputCols: false
    },
    content: (
      payload: OperationPayload<{
        order: 'asc' | 'desc';
        cast: boolean;
      }>
    ) => {
      const order = {
        asc: 'ascending',
        desc: 'descending'
      }[payload.order];
      return `b{Sort rows} in gr{${order}} order using ${
        payload.cast ? 'casted ' : ''
      }bl{${naturalJoin(payload.cols)}}${inDataframeContent(payload)}`;
    },
    action: (
      payload: OperationPayload<{
        order: 'asc' | 'desc';
        cast: boolean;
      }>
    ): Source => {
      return payload.source.rows.sort({
        target: payload.target,
        cols: payload.cols,
        order: payload.order,
        cast: payload.cast,
        requestOptions: payload.requestOptions
      });
    },
    fields: [
      {
        name: 'order',
        label: 'Order',
        type: 'string',
        defaultValue: 'asc',
        options: [
          {
            text: 'Ascending',
            value: 'asc'
          },
          {
            text: 'Descending',
            value: 'desc'
          }
        ]
      },
      {
        name: 'cast',
        label: 'Cast values before sorting',
        type: 'boolean'
      }
    ],
    shortcut: 'sr'
  },
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
    content: (
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
    ) => {
      const conditions = payload.conditions
        .map(condition => {
          const fromWhere = whereHint(condition.condition, condition);
          if (fromWhere) {
            return `\nbl{${payload.cols[0]}} ${fromWhere}`;
          }
          return '';
        })
        .filter(condition => condition);

      const action =
        payload.action === 'set'
          ? `b{Set values} to gr{${payload.value}}`
          : `b{${capitalize(payload.action)} rows}`;

      return `${action} if ${naturalJoin(conditions)}` + inColsContent(payload);
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
        const color = payload.action === 'drop' ? 'danger' : 'success';

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
          requestOptions: payload.requestOptions
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
              requestOptions: payload.requestOptions
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
            requestOptions: payload.requestOptions
          });
        case 'drop':
          return payload.source.rows.drop({
            target: payload.target,
            expr: where.join(' | '),
            requestOptions: payload.requestOptions
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
            requestOptions: payload.requestOptions
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
            options: _payload => [
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
              { divider: true },
              {
                text: 'Matches values',
                value: 'match'
              },
              {
                text: 'Mismatches values',
                value: 'mismatch'
              },
              { text: 'Missing values', value: 'missing' }
            ],
            class: (payload, currentIndex = 0): string => {
              const condition = payload.conditions[currentIndex].condition;
              switch (condition) {
                case 'value_in':
                case 'match':
                case 'mismatch':
                case 'missing':
                  return 'w-full';
                default:
                  return 'grouped-first w-1/2';
              }
            }
          },
          {
            name: 'value',
            label: (payload, currentIndex = 0): string => {
              const condition = payload.conditions[currentIndex].condition;
              switch (condition) {
                case 'between':
                  return 'Min';
                default:
                  return 'Value';
              }
            },
            type: 'string',
            class: (payload, currentIndex = 0): string => {
              const condition = payload.conditions[currentIndex].condition;
              switch (condition) {
                case 'between':
                  return 'grouped-middle w-1/4';
                default:
                  return 'grouped-last w-1/2';
              }
            },
            hidden: (payload, currentIndex = 0) => {
              const condition = payload.conditions[currentIndex].condition;
              return ['value_in', 'match', 'mismatch', 'missing'].includes(
                condition
              );
            }
          },
          {
            name: 'otherValue',
            label: 'Max',
            type: 'string',
            class: 'grouped-last w-1/4',
            hidden: (payload, currentIndex = 0) => {
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
            hidden: (payload, currentIndex = 0) => {
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
        options: payload => [
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
        hidden: payload => payload.action !== 'set'
      },
      {
        name: 'otherwise',
        label: 'Otherwise',
        type: 'string',
        hidden: payload => payload.action !== 'set'
      }
    ]
  },
  dropDuplicated: {
    name: 'Drop duplicated rows',
    alias: 'drop rows duplicated',
    defaultOptions: {
      usesInputCols: true,
      usesOutputCols: false,
      usesInputDataframe: true,
      preview: false // TODO: Implement preview
    },
    content: (
      payload: OperationPayload<{
        keep: 'first' | 'last';
        how: 'any' | 'all';
      }>
    ): string => {
      return `b{Drop duplicated rows}${inColsContent(payload)}`;
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
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'rdd'
  },
  dropEmpty: {
    name: 'Drop empty rows',
    alias: 'drop empty rows',
    defaultOptions: {
      usesInputCols: true,
      usesOutputCols: false,
      usesInputDataframe: true,
      preview: false // TODO: Implement preview
    },
    content: (
      payload: OperationPayload<{
        keep: 'first' | 'last';
        how: 'any' | 'all';
      }>
    ): string => {
      return `b{Drop empty rows}${inColsContent(payload)}`;
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
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Keep'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.keep({
        target: payload.target,
        cols: payload.cols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Drop'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.drop({
        target: payload.target,
        cols: payload.cols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'dc'
  },
  copy: {
    name: 'Copy selected columns',
    alias: 'copy duplicate columns',
    defaultOptions: {
      usesInputCols: true,
      usesOutputCols: 'required',
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Copy'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.copy({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'cc'
  },
  lower: {
    name: 'Lowercase column values',
    alias: 'Lowercase letters lower case',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Lowercase', 'letters'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.lower({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Uppercase', 'letters'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.upper({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Title case', 'values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.title({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Capitalize', 'values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.capitalize({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Remove accents', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.normalizeChars({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'lra'
  },
  removeSpecialChars: {
    name: 'Remove special chars from column values',
    alias: 'Remove special characters',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Remove special characters', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.removeSpecialChars({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: (
      payload: OperationPayload<{
        start: number;
        end: number;
      }>
    ): string => {
      return (
        `b{Extract} characters from indices \n` +
        `gr{${payload.start}} to gr{${payload.end}} \n` +
        inColsContent(payload)
      );
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
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Trim whitespaces', 'from values'),
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
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Normalize whitespaces', 'from values'),
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
        requestOptions: payload.requestOptions
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
    content: (
      payload: OperationPayload<{
        n: number;
      }>
    ): string => {
      return `Get b{Left} gr{${payload.n}} characters` + inColsContent(payload);
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
        requestOptions: payload.requestOptions
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
    content: (
      payload: OperationPayload<{
        n: number;
      }>
    ): string => {
      return (
        `Get b{Right} gr{${payload.n}} characters` + inColsContent(payload)
      );
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
        requestOptions: payload.requestOptions
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
    content: (
      payload: OperationPayload<{
        start: number;
        end: number;
      }>
    ): string => {
      return (
        `Get b{Middle} characters from indices \n` +
        `gr{${payload.start}} to gr{${payload.end}}` +
        inColsContent(payload)
      );
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
        requestOptions: payload.requestOptions
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
    content: (
      payload: OperationPayload<{
        width: number;
        side: 'left' | 'right' | 'both';
        fillChar: string;
      }>
    ): string => {
      return (
        `b{Pad} to gr{${payload.width}} characters \non the gr{${payload.side}}` +
        inColsContent(payload)
      );
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
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get absolute value', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.abs({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: (
      payload: OperationPayload<{
        decimals: number;
      }>
    ): string => {
      return (
        `b{Round} to gr{${payload.decimals}} decimals` + inColsContent(payload)
      );
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
        requestOptions: payload.requestOptions
      });
    },
    fields: [
      {
        name: 'decimals',
        label: 'Decimals',
        type: 'number',
        defaultValue: 0
      }
    ],
    shortcut: 'nrd'
  },
  floor: {
    name: 'Floor Number from column values',
    alias: 'floor',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Floor', 'values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.floor({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'nrf'
  },
  ceil: {
    name: 'Ceil from column values',
    alias: 'ceil',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Ceil', 'values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.ceil({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'nrc'
  },
  modulo: {
    name: 'Modulo from column values',
    alias: 'modulo',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Modulo', 'values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.mod({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: (
      payload: OperationPayload<{
        base: number;
      }>
    ): string => {
      return (
        `Get base gr{${payload.base}} b{Logarithm}` + inColsContent(payload)
      );
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
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Natural Logarithm', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.ln({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: (
      payload: OperationPayload<{
        power: number;
      }>
    ): string => {
      return `b{Power} to gr{${payload.power}}` + inColsContent(payload);
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
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Square Root', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.sqrt({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Sine', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.sin({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Cosine', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.cos({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Tangent', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.tan({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Inverse Sine', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.asin({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Inverse Cosine', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.acos({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Inverse Tangent', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.atan({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Hyperbolic Sine', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.sinh({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Hyperbolic Cosine', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.cosh({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Get Hyperbolic Tangent', 'from values'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.tanh({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction(
      'Get Inverse Hyperbolic Sine',
      'from values'
    ),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.asinh({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction(
      'Get Inverse Hyperbolic Cosine',
      'from values'
    ),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.acosh({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction(
      'Get Inverse Hyperbolic Tangent',
      'from values'
    ),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.atanh({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    // TODO: Content property
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
        requestOptions: payload.requestOptions
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
    // TODO: Content property
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
        requestOptions: payload.requestOptions
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
    // TODO: Content property
    action: (
      _payload: OperationPayload<{
        n: number;
        seed: number;
      }>
    ): Source => {
      throw new Error('Not implemented');
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
    content: (
      payload: OperationPayload<{
        strategy: string;
      }>
    ): string => {
      return (
        `b{Impute missing values} using gr{${payload.strategy}} strategy` +
        inColsContent(payload)
      );
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
        requestOptions: payload.requestOptions
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
    content: (
      payload: OperationPayload<{
        prefix: string;
        drop: boolean;
      }>
    ): string => {
      return (
        `b{One hot encode} columns bl{${naturalJoin(payload.cols)}}` +
        (payload.prefix ? ` with prefix gr{${payload.prefix}}` : '') +
        (payload.drop ? ' and drop the original column' : '')
      );
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
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'mo'
  },
  stringToIndex: {
    name: 'Convert string values to indices in a column',
    alias: 'string to index',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Convert string values to indices'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.stringToIndex({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Convert Index values back to String'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.indexToString({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Apply Z-score'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.zScore({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'msi'
  },
  standardScaler: {
    name: 'Standard scaler in a column',
    alias: 'standard scaler',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Apply Standard scaler'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.standardScaler({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Apply Min max scaler'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.minMaxScaler({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Apply MaxAbs scaler'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.maxAbsScaler({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
    content: defaultContentFunction('Remove stop-words'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.removeStopWords({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
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
      preview: 'custom'
    },
    content: (
      payload: OperationPayload<{
        separator: string;
        splits: number;
        drop: boolean;
      }>
    ): string => {
      return (
        `b{Unnest} ${naturalJoin(payload.cols)}` +
        inDataframeContent(payload) +
        `in gr{${payload.splits}} splits ` +
        `using gr{${payload.separator}} as split character and ` +
        `${payload.drop ? 'gr{drop}' : 'gr{keep}'} original column`
      );
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
        requestOptions: payload.requestOptions
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
      preview: 'custom'
    },
    content: (
      payload: OperationPayload<{
        separator: string;
      }>
    ): string => {
      return (
        `b{Nest} ${naturalJoin(payload.cols)}` +
        ` using gr{${payload.separator}}` +
        inDataframeContent(payload)
      );
    },
    validate: (
      payload: OperationPayload<{
        separator: string;
      }>
    ) => {
      if (payload.cols.length <= 1) {
        throw new Error('At least two columns are required', {
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
        requestOptions: payload.requestOptions
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

const preparePayloadForAction = (
  operation: Operation,
  payload: OperationPayload<PayloadWithOptions>
): OperationPayload<PayloadWithOptions> => {
  const options: OperationOptions = Object.assign(
    {},
    operation.defaultOptions,
    payload.options
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
        outputCols: [...payload.cols]
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

  payload.options = options;

  payload.requestOptions = {
    ...(payload.requestOptions || {}),
    priority: PRIORITIES.operation
  };

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
    { targetType: 'dataframe' },
    operationCreator.defaultOptions || {}
  );

  operation.validate = (payload: OperationPayload<PayloadWithOptions>) => {
    if (operationCreator.validate) {
      payload = preparePayloadForAction(operation, payload);
      return operationCreator.validate(payload);
    }
    return true;
  };

  operation.action = (payload: OperationPayload<PayloadWithOptions>) => {
    payload = preparePayloadForAction(operation, payload);
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
  let { value, values } = payload;
  const { otherValue } = payload;

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
    case 'missing':
      return `df.mask.null("${col}")`;
    case 'match':
      return `df.mask.match("${col}", df.cols.inferred_data_type("${col}", use_internal=True))`;
    case 'mismatch':
      return `df.mask.mismatch("${col}", df.cols.inferred_data_type("${col}", use_internal=True))`;
    default:
      console.warn('Unknown condition', condition);
  }
  return '';
}

function whereHint(
  condition: string,
  payload: {
    value: BasicType;
    otherValue: BasicType;
    values: BasicType[];
  }
): string {
  switch (condition) {
    case 'equal':
      return `is equal to gr{${payload.value}}`;
    case 'not_equal':
      return `is not equal to gr{${payload.value}}`;
    case 'greater_than':
      return `is greater than gr{${payload.value}}`;
    case 'greater_than_equal':
      return `is greater than or equal to gr{${payload.value}}`;
    case 'less_than':
      return `is less than gr{${payload.value}}`;
    case 'less_than_equal':
      return `is less than or equal to gr{${payload.value}}`;
    case 'value_in':
      return `is in gr{${payload.values.join(', ')}}`;
    case 'between':
      return `is between gr{${payload.value}} and gr{${payload.otherValue}}`;
    case 'missing':
      return `is missing`;
    case 'match':
      return `matches`;
    case 'mismatch':
      return `does not match`;
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

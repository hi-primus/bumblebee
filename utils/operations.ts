import { mdiAutoFix } from '@mdi/js';

import { ModelResponse } from '@/types/app';
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
import { PRIORITIES, pythonArguments } from '@/utils/blurr';
import { getGptResponse } from '@/utils/gpt';
import {
  getDriftTableData,
  getModelOptions,
  getModelVersionsOptions
} from '@/utils/ml';

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
  return (
    `df{ \nin rd{dn{${payload.source.name}}}` +
    (payload.target && payload.target !== payload.source.name
      ? ` \nto rd{dn{${payload.target}}}`
      : '') +
    `}`
  );
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
      preview: 'dataframe'
    },
    content: (payload: { target: string; url: string; file: File }) => {
      let str = '';
      if (payload.file?.name) {
        str += `b{Load} gr{${payload.file.name}} file`;
      } else {
        const fileName = payload.url?.split('/').pop();
        str += `b{Load} gr{${fileName}} file from url`;
      }
      if (payload.target) {
        str += ` \nto rd{dn{${payload.target}}}`;
      }
      return str;
    },
    action: async (
      payload: OperationPayload<{
        url?: string;
        nRows?: number;
        file?: File;
        fileName?: string;
      }>
    ): Promise<Source> => {
      const previewPayload = { ...payload };
      
      if (payload.options.preview) {
        previewPayload.nRows = Math.min(payload.nRows || 50, 50);
      }

      if (payload.file) {
        payload.fileName = payload.file?.name || payload.fileName;

        if (payload.requestOptions.getCode) {
          // TODO: handle uploaded urls
          return payload.app.blurr.readFile({
            target: payload.target,
            url: payload.file.name,
            nRows: previewPayload.nRows,
            ...(payload.fileName
              ? { meta: { file_name: payload.fileName } }
              : {}),
            requestOptions: payload.requestOptions
          });
        }

        let buffer: ArrayBuffer;
        if (payload.app.settings.workspaceMode && !payload.options.preview) {
          const response = await payload.app.uploadFile(payload.file);
          if (response.filepath) {
            payload.url = response.filepath;
            delete payload.file;
          } else {
            payload.app.addToast({
              type: 'error',
              title: 'File upload failed'
            });
          }
        }

        if (payload.file) {
          if (payload.options.preview) {
            const string = await getFirstLines(payload.file);
            buffer = new TextEncoder().encode(string).buffer;
          } else {
            buffer = await payload.file.arrayBuffer();
          }

          return payload.app.blurr.readFile({
            target: payload.target,
            buffer,
            nRows: payload.nRows,
            ...(payload.fileName
              ? { meta: { file_name: payload.fileName } }
              : {}),
            requestOptions: payload.requestOptions
          });
        }
      }

      if (payload.url) {
        return payload.app.blurr.readFile({
          target: payload.target,
          url: payload.url,
          nRows: payload.nRows,
          ...(payload.fileName
            ? { meta: { file_name: payload.fileName } }
            : {}),
          requestOptions: payload.requestOptions
        });
      }

      throw new Error('No file or url provided');
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
        throw new Error('No dataframe to save');
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
  join: {
    name: 'Join dataframes',
    defaultOptions: {
      usesInputDataframe: true,
      preview: 'dataframe',
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
      let str = `b{Join} rd{${dfName}} and rd{${payload.dfRightName}} dataframes using \ngr{${payload.how}} join`;

      const leftOn = payload.columns.left?.find(col => col.isKey)?.name;
      const rightOn = payload.columns.right?.find(col => col.isKey)?.name;

      if (leftOn === rightOn) {
        str += `\nand gr{${leftOn}} as join key`;
      } else {
        str += `\nand gr{${leftOn}} as left join key and \ngr{${rightOn}} as right join key`;
      }

      if (payload.target && payload.target !== payload.source.name) {
        str += ` \nto rd{dn{${payload.target}}}`;
      }

      return str;
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
        throw new FieldsError(
          `Dataframe with name '${payload.dfRightName}' not found`,
          {
            dfRightName: 'Select another dataframe'
          }
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

      let rowsCount: number | null = null;

      // loop until the dataframe is big enough to show the preview

      const leftColumnsInput = payload.columns.left
        .filter(c => c.selected)
        .map(c => c.name);

      const rightColumnsInput = payload.columns.right
        .filter(c => c.selected)
        .map(c => c.name);

      while (true) {
        if (payload.options.preview) {
          // Use just a part of the dataframe on preview
          df = payload.source.cols
            .select({
              target: payload.target,
              cols: leftColumnsInput
            })
            .iloc({
              target: payload.target,
              lower_bound: 0,
              upper_bound: upperBound
            });
          dfRight = await dfRight.cols
            .select({
              target: 'preview_df_right',
              cols: rightColumnsInput
            })
            .iloc({
              target: 'preview_df_right',
              lower_bound: 0,
              upper_bound: upperBound
            });
        } else {
          df = payload.source.cols.select({
            target: payload.target,
            cols: leftColumnsInput,
            requestOptions: payload.requestOptions
          });
          dfRight = await dfRight.cols.select({
            target: 'preview_df_right',
            cols: rightColumnsInput,
            requestOptions: payload.requestOptions
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

        // break if the dataframe is big enough to show the preview

        rowsCount = await df.rows.count({
          requestOptions: payload.requestOptions
        });

        if (rowsCount < minRows && upperBound < maxSampleSize) {
          upperBound *= 8;
        } else {
          break;
        }

        // break if it's not a preview

        if (!payload.options.preview) {
          break;
        }
      }

      if (!rowsCount) {
        throw new Error(`Join was not successful. Please check the join keys`);
      }

      const resultColumns = await df.cols.names({
        requestOptions: payload.requestOptions
      });

      const leftColumns: string[] = [];

      leftColumnsInput.forEach(col => {
        if (leftOn === col) {
          return;
        }
        if (resultColumns.includes(col) && !rightColumnsInput.includes(col)) {
          leftColumns.push(col);
        }
        if (resultColumns.includes(`${col}_left`)) {
          leftColumns.push(`${col}_left`);
        }
      });

      const rightColumns: string[] = [];

      rightColumnsInput.forEach(col => {
        if (rightOn === col) {
          return;
        }
        if (resultColumns.includes(col) && !leftColumnsInput.includes(col)) {
          rightColumns.push(col);
        }
        if (resultColumns.includes(`${col}_right`)) {
          rightColumns.push(`${col}_right`);
        }
      });

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

        return await df.cols
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
        return await df.cols.select({
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
      },
      {
        name: 'preview-warning',
        type: 'message',
        class: '!text-warning-darker',
        defaultValue:
          'Preview shows a subset of rows, final result may contain additional data'
      }
    ],
    shortcut: 'jd'
  },
  concat: {
    name: 'Concatenate dataframes',
    alias: 'append dataset values',
    defaultOptions: {
      usesInputDataframe: true,
      preview: false,
      usesDialog: true,
      containerClass: '!bg-primary-highlight !min-w-[calc(100%-128px)]'
    },
    content: (
      payload: OperationPayload<{
        concat: {
          dfs: { name: string }[];
          outputColumns: {
            value: string;
            columns: {
              name: string;
            };
          }[];
        };
      }>
    ) => {
      const foundDf = payload.allDataframes.find(
        df => df.df.name === payload.source.name
      );
      const dfName = foundDf?.name || `dn{${payload.source.name}}`;
      return (
        'b{Concat} ' +
        naturalJoin(
          [dfName, ...payload.concat.dfs.map(df => df.name)].map(
            df => `rd{${df}}`
          )
        )
      );
    },
    action: (
      payload: OperationPayload<{
        concat: {
          dfs?: { sourceId: string }[];
          outputColumns: {
            value: string;
            columns: (string | undefined)[];
          }[];
        };
      }>
    ) => {
      const dfs =
        payload.concat.dfs
          ?.map(
            df =>
              payload.allDataframes?.find(d => d.sourceId === df.sourceId)?.df
          )
          .filter(df => df) || [];

      const namesMap = payload.concat.outputColumns.reduce((acc, col) => {
        const columns = col.columns.map(c => c || false);
        acc[col.value] = columns;
        return acc;
      }, {} as Record<string, (string | false)[]>);

      return payload.source.rows.append({
        target: payload.target,
        dfs,
        namesMap,
        requestOptions: payload.requestOptions
      });
    },
    fields: [
      {
        name: 'concat',
        type: 'concat',
        defaultValue: { outputColumns: [] }
      }
    ],
    shortcut: 'co'
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
          col: string;
          value: string;
        }[];
      }>
    ) => {
      const str =
        payload.sets.length > 1 ? 'b{Create columns}' : 'b{Create column}';
      const sets = payload.sets.map((setItem, index) => {
        const columnName = getNameFromSetItem(setItem, index);
        return `\nbl{${columnName}} with value gr{${setItem.value}}`;
      });
      return `${str} ${naturalJoin(sets)}` + inDataframeContent(payload);
    },
    action: (
      payload: OperationPayload<{
        sets: {
          col: string;
          value: string;
        }[];
      }>
    ): Source => {
      const valueFunc = payload.sets.map(s =>
        s.value ? Name(`parse('${s.value}', data=False)`) : '""'
      ); // empty expression

      let outputCols = payload.sets.map((setItem, index) =>
        getNameFromSetItem(setItem, index)
      );

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
    handleError: (error, payload) => {
      const errorMessage = typeof error === 'string' ? error : error?.message;

      if (errorMessage.includes("'missing_columns' must be")) {
        let receivedValue = errorMessage.match(
          /received (\[.*?\]|'\[.*?\]'|'([^']*)')/
        )?.[1];

        let newMessage = 'Unknown column(s) or expression';

        let columns: string[] = [];

        if (receivedValue) {
          if (
            receivedValue?.startsWith("'[") &&
            receivedValue?.endsWith("]'")
          ) {
            receivedValue = receivedValue.slice(2, -2);
          }
          if (receivedValue?.startsWith("'") && receivedValue?.endsWith("'")) {
            receivedValue = receivedValue.slice(1, -1);
          }

          columns = receivedValue.split("', '");

          const s = columns.length > 1 ? 's' : '';

          newMessage = `Unknown column${s} or expression${s}: '${columns.join(
            "', '"
          )}'`;
        }

        const fieldMessages =
          payload?.sets?.reduce?.((acc, set, index) => {
            const found: string[] = columns.filter(c =>
              set?.value?.includes(c)
            );

            if (found.length) {
              const s = found.length > 1 ? 's' : '';
              acc[
                `sets-${index}-value`
              ] = `Unknown column${s} or expression${s}: '${found.join(
                "', '"
              )}'`;
            }
            return acc;
          }, {}) || {};

        return new FieldsError(
          Object.keys(fieldMessages).length ? '' : newMessage,
          fieldMessages
        );
      }

      return error;
    },
    fields: [
      {
        name: 'sets',
        label: 'Columns',
        type: 'group',
        groupConnector: '',
        fields: [
          {
            name: 'col',
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
    name: 'Set column value by condition',
    alias:
      'Replace greater less than or equal to missing match mismatch match_pattern',
    defaultOptions: {
      usesInputCols: { min: 1, max: 1 },
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
              { divider: true },
              { text: 'Custom expression', value: 'where', hidden: true },
              {
                text: 'Pattern',
                value: 'match_pattern'
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
              const condition = payload.replaces?.[currentIndex]?.condition;
              switch (condition) {
                case 'value_in':
                case 'match_pattern':
                  return 'w-full';
                case 'between':
                  return 'grouped-first w-1/4';
                default:
                  return 'grouped-first w-1/3';
              }
            }
          },
          {
            name: 'mode',
            label: 'Mode',
            type: 'string',
            defaultValue: 0,
            class: 'grouped-first w-1/2',
            options: [
              { text: '(U, l, #, !)', value: 0 },
              { text: '(c, #, !)', value: 1 },
              { text: '(*, !)', value: 2 },
              { text: '(*)', value: 3 }
            ],
            hidden: (payload, currentIndex = 0): boolean => {
              const condition = payload.replaces?.[currentIndex]?.condition;
              return condition !== 'match_pattern';
            }
          },
          {
            name: 'value',
            label: (payload, currentIndex = 0) => {
              const condition = payload.replaces?.[currentIndex]?.condition;
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
              const condition = payload.replaces?.[currentIndex]?.condition;
              switch (condition) {
                case 'match_pattern':
                  return 'grouped-last w-1/2';
                case 'between':
                  return 'grouped-middle w-1/4';
                default:
                  return 'grouped-middle w-1/3';
              }
            },
            hidden: (payload, currentIndex = 0) => {
              const condition = payload.replaces?.[currentIndex]?.condition;
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
              const condition = payload.replaces?.[currentIndex]?.condition;
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
              const condition = payload.replaces?.[currentIndex]?.condition;
              return condition !== 'value_in';
            }
          },
          {
            name: 'replaceBy',
            label: 'Replace by',
            type: 'string',
            class: (payload, currentIndex = 0) => {
              const condition = payload.replaces?.[currentIndex]?.condition;
              switch (condition) {
                case 'value_in':
                case 'match_pattern':
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
    name: 'Replace content in column values',
    alias: 'words characters string',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
      usesDiff: true
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
  formatByExample: {
    name: 'Format column by example (GPT)',
    uses: 'functionToColumns',
    disabled: context => {
      if (!context.appSettings.openAiApiKey) {
        return 'You need to set an OpenAI API key in the settings';
      }
      return false;
    },
    defaultPayload: {
      funcDef: '',
      useFormat: true
    },
    shortcut: 'fe'
  },
  functionUsingGPT: {
    name: 'Apply function using description (GPT)',
    uses: 'functionToColumns',
    disabled: context => {
      if (!context.appSettings.openAiApiKey) {
        return 'You need to set an OpenAI API key in the settings';
      }
      return false;
    },
    defaultPayload: {
      funcDef: ''
    },
    shortcut: 'fd'
  },
  // Row operations
  sortRows: {
    name: 'Sort rows',
    alias: 'reorder rows',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'dataframe no-profile',
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
            where: where.join(' | '),
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
              { divider: true },
              { text: 'Custom expression', value: 'where', hidden: true },
              {
                text: 'Pattern',
                value: 'match_pattern'
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
              const condition = payload.conditions?.[currentIndex]?.condition;
              switch (condition) {
                case 'value_in':
                case 'match':
                case 'mismatch':
                case 'missing':
                  return 'w-full';
                case 'match_pattern':
                  return 'grouped-first w-1/3';
                default:
                  return 'grouped-first w-1/2';
              }
            }
          },
          {
            name: 'mode',
            label: 'Mode',
            type: 'string',
            defaultValue: 0,
            class: 'grouped-middle w-1/3',
            options: [
              { text: '(U, l, #, !)', value: 0 },
              { text: '(c, #, !)', value: 1 },
              { text: '(*, !)', value: 2 },
              { text: '(*)', value: 3 }
            ],
            hidden: (payload, currentIndex = 0): boolean => {
              const condition = payload.conditions?.[currentIndex]?.condition;
              return condition !== 'match_pattern';
            }
          },
          {
            name: 'value',
            label: (payload, currentIndex = 0): string => {
              const condition = payload.conditions?.[currentIndex]?.condition;
              switch (condition) {
                case 'between':
                  return 'Min';
                default:
                  return 'Value';
              }
            },
            type: 'string',
            class: (payload, currentIndex = 0): string => {
              const condition = payload.conditions?.[currentIndex]?.condition;
              switch (condition) {
                case 'between':
                  return 'grouped-middle w-1/4';
                case 'match_pattern':
                  return 'grouped-last w-1/3';
                default:
                  return 'grouped-last w-1/2';
              }
            },
            hidden: (payload, currentIndex = 0) => {
              const condition = payload.conditions?.[currentIndex]?.condition;
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
              const condition = payload.conditions?.[currentIndex]?.condition;
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
              const condition = payload.conditions?.[currentIndex]?.condition;
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
  outliers: {
    name: 'Filter or replace outliers',
    alias: 'drop keep mad modified zscore z score tukey bounds whiskers',
    defaultOptions: {
      usesInputCols: true,
      usesOutputCols: false,
      usesInputDataframe: true,
      preview: 'highlight rows'
    },
    content: (
      payload: OperationPayload<{
        method: 'mad' | 'tukey' | 'z_score' | 'modified_z_score';
        lowerBoundAction: 'keep' | 'drop' | 'replace';
        lowerBound: number;
        lowerBoundValue: string;
        upperBoundAction: 'keep' | 'drop' | 'replace';
        upperBound: number;
        upperBoundValue: string;
      }>
    ) => {
      let str = '';
      let actions: ('keep' | 'drop' | 'replace')[] = [];

      const {
        method,
        lowerBoundAction,
        lowerBound,
        lowerBoundValue,
        upperBoundAction,
        upperBound,
        upperBoundValue
      } = payload;

      actions = [lowerBoundAction, upperBoundAction];

      str += actions
        .map((action, i) => {
          const bound = i === 0 ? lowerBound : upperBound;
          const value = i === 0 ? lowerBoundValue : upperBoundValue;
          if (action === 'drop') {
            return `b{Drop values} ${i === 0 ? 'below' : 'above'} gr{${bound}}`;
          }
          if (action === 'replace') {
            return `b{Replace values} ${
              i === 0 ? 'below' : 'above'
            } gr{${bound}} with gr{${value}}`;
          }
          return '';
        })
        .filter(a => a)
        .join(' and ');

      str += ` using gr{${
        {
          mad: 'MAD',
          tukey: 'Tukey',
          z_score: 'Z-score',
          modified_z_score: 'Modified Z-score'
        }[method]
      }} method`;

      return str + inColsContent(payload);
    },
    shortcut: 'ou',
    action: async (
      payload: OperationPayload<{
        method: 'mad' | 'tukey' | 'z_score' | 'modified_z_score';
        lowerBoundAction: 'keep' | 'drop' | 'replace';
        lowerBound: number;
        lowerBoundValue: string;
        upperBoundAction: 'keep' | 'drop' | 'replace';
        upperBound: number;
        upperBoundValue: string;
      }>
    ): Promise<Source> => {
      const usesZscore = ['z_score', 'modified_z_score'].includes(
        payload.method
      );

      let df: Source = payload.source;

      const zScoreCols = payload.cols.map(
        col => `__bumblebee__preview__Z-score (${col})`
      );

      let inputCol = payload.cols[0];

      if (usesZscore) {
        df = await (payload.method === 'z_score'
          ? df.cols.zScore
          : df.cols.modifiedZScore)({
          cols: payload.cols,
          outputCols: zScoreCols,
          target: payload.target,
          requestOptions: payload.requestOptions
        });

        inputCol = zScoreCols[0];
      }

      const lowerBoundWhere = whereExpression(
        'less_than_equal',
        { value: payload.lowerBound },
        inputCol
      );

      const upperBoundWhere = whereExpression(
        'greater_than_equal',
        { value: payload.upperBound },
        inputCol
      );

      const isPreview = payload.options.preview;

      const outputCols = isPreview
        ? payload.cols.map(col => `__bumblebee__preview__${col}`)
        : payload.cols;

      const bounds = [
        [lowerBoundWhere, payload.lowerBoundAction, payload.lowerBoundValue],
        [upperBoundWhere, payload.upperBoundAction, payload.upperBoundValue]
      ] as const;

      if (isPreview && bounds.some(([_, action]) => action === 'replace')) {
        df = df.cols.copy({
          target: payload.target,
          cols: payload.cols,
          outputCols
        });
      }

      bounds.forEach(([where, action, value], index) => {
        if (action === 'replace') {
          if (isPreview) {
            df = df.cols.set({
              target: payload.target,
              cols: `__bumblebee__highlight_row__info__${index}`,
              valueFunc: true,
              evalValue: false,
              where,
              default: false,
              requestOptions: payload.requestOptions
            });
          }
          df = df.cols.set({
            target: payload.target,
            cols: outputCols,
            valueFunc: value,
            evalValue: false,
            where: isPreview
              ? `df['__bumblebee__highlight_row__info__${index}']`
              : where,
            default: null,
            requestOptions: payload.requestOptions
          });
        } else if (action === 'drop') {
          if (isPreview) {
            df = df.cols.set({
              target: payload.target,
              cols: `__bumblebee__highlight_row__danger__${index}`,
              valueFunc: true,
              evalValue: false,
              where,
              default: false,
              requestOptions: payload.requestOptions
            });
          } else {
            df = df.rows.drop({
              target: payload.target,
              where,
              requestOptions: payload.requestOptions
            });
          }
        }
      });

      if (usesZscore && !isPreview) {
        df = await df.cols.drop({
          target: payload.target,
          cols: zScoreCols,
          requestOptions: payload.requestOptions
        });
      }

      return df;
    },
    fields: [
      {
        name: 'method',
        label: 'Method',
        type: 'string',
        defaultValue: 'mad',
        options: [
          {
            text: 'MAD',
            value: 'mad'
          },
          {
            text: 'Tukey',
            value: 'tukey'
          },
          {
            text: 'Z-score',
            value: 'z_score'
          },
          {
            text: 'Modified Z-score',
            value: 'modified_z_score'
          }
        ],
        onChange: async (payload, value, oldValue) => {
          if (typeof value === 'string') {
            if (value !== oldValue) {
              const dfName = payload.source?.name;
              const blurr = payload.source?.client;
              if (!dfName) {
                throw new Error('No dataframe found');
              }
              if (!blurr) {
                throw new Error('Blurr client not available');
              }
              if (['z_score', 'modified_z_score'].includes(payload.method)) {
                payload.defaultLowerBound = -2;
                payload.lowerBound = -2;
                payload.defaultUpperBound = 2;
                payload.upperBound = 2;
              } else {
                const result = await blurr.runCode(
                  `tmp = ${dfName}.outliers.${payload.method}('${payload.cols[0]}'` +
                    (value === 'mad' ? `, threshold=1` : '') +
                    `)\n` +
                    `{ "lowerBound": tmp.lower_bound, "upperBound": tmp.upper_bound }`
                );
                if (
                  result &&
                  typeof result === 'object' &&
                  'lowerBound' in result &&
                  'upperBound' in result
                ) {
                  const { lowerBound, upperBound } = result;
                  payload.defaultLowerBound = lowerBound;
                  payload.lowerBound = lowerBound;
                  payload.defaultUpperBound = upperBound;
                  payload.upperBound = upperBound;
                } else {
                  console.error('[DEBUG] Unknown response format', result);
                }
              }
            }
          }
          return payload;
        }
      },
      {
        name: 'lowerBoundAction',
        label: 'Action (lower bound)',
        type: 'string',
        defaultValue: 'drop',
        options: [
          {
            text: 'Drop',
            value: 'drop'
          },
          {
            text: 'Replace',
            value: 'replace'
          },
          {
            text: 'Keep',
            value: 'keep'
          }
        ],
        class: (payload): string => {
          switch (payload.lowerBoundAction) {
            case 'drop':
              return 'grouped-first w-1/2';
            case 'replace':
              return 'grouped-first w-1/3';
            default:
              return 'w-full';
          }
        }
      },
      {
        name: 'lowerBound',
        label: 'Values below',
        type: 'number',
        hidden: payload => payload.lowerBoundAction === 'keep',
        class: (payload): string => {
          switch (payload.lowerBoundAction) {
            case 'drop':
              return 'grouped-last w-1/2';
            case 'replace':
              return 'grouped-middle w-1/3';
            default:
              return 'w-full';
          }
        }
      },
      {
        name: 'lowerBoundValue',
        label: 'Replace by',
        type: 'string',
        hidden: payload => payload.lowerBoundAction !== 'replace',
        class: 'grouped-last w-1/3'
      },
      {
        name: 'upperBoundAction',
        label: 'Action (upper bound)',
        type: 'string',
        defaultValue: 'drop',
        options: [
          {
            text: 'Drop',
            value: 'drop'
          },
          {
            text: 'Replace',
            value: 'replace'
          },
          {
            text: 'Keep',
            value: 'keep'
          }
        ],
        class: (payload): string => {
          switch (payload.upperBoundAction) {
            case 'drop':
              return 'grouped-first w-1/2';
            case 'replace':
              return 'grouped-first w-1/3';
            default:
              return 'w-full';
          }
        }
      },
      {
        name: 'upperBound',
        label: 'Values above',
        type: 'number',
        hidden: payload => payload.upperBoundAction === 'keep',
        class: (payload): string => {
          switch (payload.upperBoundAction) {
            case 'drop':
              return 'grouped-last w-1/2';
            case 'replace':
              return 'grouped-middle w-1/3';
            default:
              return 'w-full';
          }
        }
      },
      {
        name: 'upperBoundValue',
        label: 'Replace by',
        type: 'string',
        hidden: payload => payload.upperBoundAction !== 'replace',
        class: 'grouped-last w-1/3'
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
  getAggregations: {
    name: 'Get aggregations',
    alias: 'aggregate',
    defaultOptions: {
      usesInputCols: {
        min: 1,
        label: 'Group by'
      },
      usesOutputCols: false,
      usesInputDataframe: true,
      saveToNewDataframe: true,
      preview: 'dataframe'
    },
    action(
      payload: OperationPayload<{
        aggregations: {
          column: string;
          aggregation: string;
        }[];
      }>
    ): Source {
      const agg = payload.aggregations.reduce((acc, agg) => {
        if (!agg.column || !agg.aggregation) {
          return acc;
        }
        const name = `${agg.column}_${agg.aggregation}`;
        if (!acc[name]) {
          acc[name] = {};
        }
        acc[name][agg.column] = agg.aggregation;
        return acc;
      }, {} as Record<string, Record<string, string>>);

      return payload.source.cols.groupBy({
        target: payload.target,
        by: payload.cols,
        agg,
        requestOptions: payload.requestOptions
      });
    },
    content: (
      payload: OperationPayload<{
        aggregations: {
          column: string;
          aggregation: string;
        }[];
      }>
    ): string => {
      return `b{Get rows aggregations}${inColsContent(payload)}`; // TO-DO: Add aggregations
    },
    fields: [
      {
        name: 'aggregations',
        label: 'Aggregations',
        type: 'group',
        fields: [
          {
            name: 'column',
            label: 'Column',
            type: 'string',
            class: 'grouped-first w-1/2',
            options: (payload: OperationPayload) => {
              return payload.allColumns.map(col => ({
                text: col,
                value: col
              }));
            }
          },
          {
            name: 'aggregation',
            label: 'Aggregation',
            type: 'string',
            class: 'grouped-last w-1/2',
            options: [
              { text: 'Count', value: 'count' },
              { text: 'Sum', value: 'sum' },
              { text: 'Mean', value: 'mean' },
              { text: 'Std', value: 'std' },
              { text: 'Min', value: 'min' },
              { text: 'Max', value: 'max' },
              { text: 'First', value: 'first' },
              { text: 'Last', value: 'last' }
            ]
          }
        ]
      }
    ],
    shortcut: 'ag'
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
  move: {
    name: 'Move columns',
    hidden: true,
    defaultOptions: {
      usesInputDataframe: true,
      usesInputCols: false
    },
    content: (
      payload: OperationPayload<{
        cols: string[];
        position: 'before' | 'after';
        refCol: string;
      }>
    ) => {
      const cols = payload.cols.map(col => `bl{${col}}`).join(', ');
      return (
        `b{Move} ${cols} gr{${payload.position}} bl{${payload.refCol}}` +
        inDataframeContent(payload)
      );
    },
    action: (
      payload: OperationPayload<{
        cols: string[];
        position: 'before' | 'after';
        refCol: string;
      }>
    ): Source => {
      return payload.source.cols.move({
        target: payload.target,
        column: payload.cols,
        position: payload.position,
        refCol: payload.refCol,
        requestOptions: payload.requestOptions
      });
    }
  },
  sort: {
    name: 'Sort columns',
    alias: 'sort move order change reorder columns',
    defaultOptions: {
      usesInputDataframe: true,
      usesInputCols: false,
      preview: 'dataframe no-profile'
    },
    content: (
      payload: OperationPayload<{
        cols: string[];
      }>
    ) => {
      const cols = payload.cols.map(col => `bl{${col}}`).join(', ');
      return `b{Sort} ${cols}`;
    },
    action: (
      payload: OperationPayload<{
        cols: string[];
      }>
    ): Source => {
      return payload.source.cols.select({
        target: payload.target,
        cols: payload.cols,
        requestOptions: payload.requestOptions
      });
    },
    fields: [
      {
        name: 'cols',
        type: 'columns sort'
      }
    ],
    shortcut: 'cs'
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
      preview: 'basic columns',
      usesDiff: true
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
  len: {
    name: 'Length of strings',
    alias: 'Length of the string',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Length', 'string'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.len({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'ls'
  },
  wordCount: {
    name: 'Count words in strings',
    alias: 'Count words in strings',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Count', 'words'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.wordCount({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'cw'
  },
  wordTokenizer: {
    name: 'Split Text into Tokens',
    alias: 'Split Text into Tokens',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Count', 'words'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.wordTokenizer({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'cw'
  },
  removeNumbers: {
    name: 'Remove numbers',
    alias: 'Remove numbers',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
      usesDiff: true
    },
    content: defaultContentFunction('Remove', 'Numbers'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.removeNumbers({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'rn'
  },
  removeURLS: {
    name: 'Remove URLs from string',
    alias: 'Remove URLs from string',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
      usesDiff: true
    },
    content: defaultContentFunction('Remove', 'URLs'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.removeURLS({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'rus'
  },
  stripHTML: {
    name: 'Strip HTML tags',
    alias: 'remove tag',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
      usesDiff: true
    },
    content: defaultContentFunction('Strip', 'Html'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.stripHTML({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'shs'
  },
  lemmatizeVerbs: {
    name: 'Lemmatize Verbs',
    alias: 'Lemmatize Verbs',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
      usesDiff: true
    },
    content: defaultContentFunction('Lemmatize', 'Verbs'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.lemmatizeVerbs({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'shs'
  },
  zScore: {
    name: 'Calculate Z-score',
    alias: 'Calculate Z-score',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Calculate ', 'ZScore'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.zScore({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'zs'
  },
  modifiedZScore: {
    name: 'Calculate Modified Z-score',
    alias: 'Calculate Modified Z-score',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: (
      payload: OperationPayload<{
        estimate: boolean;
      }>
    ): string => {
      return `b{Estimate} to gr{${payload.estimate}}` + inColsContent(payload);
    },
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.modifiedZScore({
        target: payload.target,
        cols: payload.cols,
        estimate: payload.estimate,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'mzs'
  },
  removeStopWords: {
    name: 'Remove stop-words by language',
    alias: 'Remove stop-words by language',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
      usesDiff: true
    },
    content: defaultContentFunction('Remove', 'Stop-words'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.removeStopWords({
        target: payload.target,
        cols: payload.cols,
        language: payload.language,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'rss'
  },
  numToWords: {
    name: 'Convert numbers to words',
    alias: 'Convert numbers to words',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Number', 'to words'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.numToWords({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'nw'
  },
  upper: {
    name: 'Uppercase column values',
    alias: 'Uppercase letters upper case',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
      usesDiff: true
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
  matchRatingEncoder: {
    name: 'Apply soundex algorithm to a specific column',
    alias: 'soundex',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Soundex', 'letters'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.soundex({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'ss'
  },
  nysiis: {
    name: 'nysiis',
    alias:
      'The match rating approach (MRA) is a phonetic algorithm developed by Western Airlines in 1977',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('nysiis', 'letters'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.nysiis({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'ss'
  },
  metaphone: {
    name: 'Metaphone',
    alias: 'Apply the Metaphone algorithm to a specified column',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Metaphone', 'letters'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.metaphone({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'ss'
  },
  title: {
    name: 'Title case column values',
    alias: 'Upper first letter',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
  functionToColumns: {
    name: 'Apply function to columns',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: (
      payload: OperationPayload<{
        targetFormat: string;
      }>
    ) => {
      return (
        `b{Format by example} using gr{${payload.targetFormat}}` +
        inColsContent(payload)
      );
    },
    validate: (
      payload: OperationPayload<{
        funcDef: string;
      }>
    ) => {
      if (!payload.funcDef) {
        throw new Error('Generate or paste a function definition');
      }
      return true;
    },
    action: async (
      payload: OperationPayload<{
        funcDef: string;
      }>
    ) => {
      const funcName = payload.funcDef.match(/def\s+(\w+)\(/)?.[1];
      if (!funcName) {
        throw new FieldsError('Enter a valid function definition', {
          funcDef: 'Enter a valid function definition'
        });
      }
      const args = pythonArguments({
        cols: payload.cols,
        output_cols: payload.outputCols,
        func: Name(funcName)
      });
      const code =
        payload.funcDef +
        '\n' +
        `${payload.target} = ${payload.source}.cols.apply(${args})` +
        '\n' +
        `${payload.target}`;
      const source = await payload.app.blurr.runCode(code);
      source.name = payload.target;
      return source;
    },
    fields: [
      {
        name: 'targetFormat',
        label: 'New format example',
        placeholder: 'Insert new format here',
        type: 'string',
        class: 'field-mono w-full',
        actionButton: {
          label: 'Generate function',
          icon: mdiAutoFix,
          action: async (payload: OperationPayload) => {
            const df = payload.source;

            const target = `${df.name}_sample`;

            const result = await df.cols
              .select({
                cols: payload.cols,
                target,
                requestOptions: {
                  priority: PRIORITIES.requirement
                }
              })
              .iloc({
                lower_bound: 0,
                upper_bound: 20,
                target,
                requestOptions: {
                  priority: PRIORITIES.requirement
                }
              })
              .columnsSample({
                requestOptions: {
                  priority: PRIORITIES.requirement
                }
              });

            const sampleData = result.value.map((row: any) => `${row[0]}`);

            const finalFormat = payload.targetFormat;

            const prompt =
              `Write a Python function that receives a pandas series including these strings '''` +
              sampleData +
              `''' and returns a pandas series with values with the format that matches the following example '''` +
              finalFormat +
              `'''. The function should work for pandas series with the passed value and more. Do not provide any explanations or examples of usage. Enclose the function code between the comments '###START' and '###END'. Only provide the Python function code.`;

            const funcDefResponse = await getGptResponse(
              prompt,
              payload.app.settings.openAiApiKey
            );

            // trim between the comments ### START and ### END and save to payload.funcDef

            const funcDefMatch = funcDefResponse.match(
              /(?<=###START\s*).*?(?=\s*###END)/gs
            );

            if (funcDefMatch) {
              payload.funcDef = funcDefMatch[0];
            } else {
              throw new Error(
                `Invalid function definition:\n${funcDefResponse}`
              );
            }
          }
        },
        hidden: (payload: OperationPayload) => {
          return !payload.useFormat || !payload.app.settings.openAiApiKey;
        }
      },
      {
        name: 'functionDescription',
        label: 'Function description',
        placeholder: 'Insert function description here',
        type: 'string',
        class: 'field-mono w-full',
        actionButton: {
          label: 'Generate function',
          icon: mdiAutoFix,
          action: async (payload: OperationPayload) => {
            const df = payload.source;

            const target = `${df.name}_sample`;

            const result = await df.cols
              .select({
                cols: payload.cols,
                target,
                requestOptions: {
                  priority: PRIORITIES.requirement
                }
              })
              .iloc({
                lower_bound: 0,
                upper_bound: 20,
                target,
                requestOptions: {
                  priority: PRIORITIES.requirement
                }
              })
              .columnsSample({
                requestOptions: {
                  priority: PRIORITIES.requirement
                }
              });

            const sampleData = result.value.map((row: any) => `${row[0]}`);

            const functionDescription = payload.functionDescription;

            const prompt =
              `Write a Python function that receives a pandas series including these strings '''` +
              sampleData +
              `''' and returns a pandas series with the result values of a function that matches the following description '''` +
              functionDescription +
              `'''. The function should work for pandas series with the passed value and more. Do not provide any explanations or examples of usage. Enclose the function code between the comments '###START' and '###END'. Only provide the Python function code.`;

            const funcDefResponse = await getGptResponse(
              prompt,
              payload.app.settings.openAiApiKey
            );

            // trim between the comments ### START and ### END and save to payload.funcDef

            const funcDefMatch = funcDefResponse.match(
              /(?<=###START\s*).*?(?=\s*###END)/gs
            );

            if (funcDefMatch) {
              payload.funcDef = funcDefMatch[0];
            } else {
              throw new Error(
                `Invalid function definition:\n${funcDefResponse}`
              );
            }
          }
        },
        hidden: (payload: OperationPayload) => {
          return Boolean(
            payload.useFormat || !payload.app.settings.openAiApiKey
          );
        }
      },
      {
        name: 'funcDef',
        label: 'Function definition',
        type: 'multiline string',
        defaultValue: 'def format_date(value):\n  return value',
        class: 'field-mono w-full',
        rules: [
          funcDef =>
            !funcDef.match(/def\s+(\w+)\(/)?.[1]
              ? 'Invalid function definition'
              : true
        ]
      }
    ],
    shortcut: 'fc'
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
    alias: 'round',
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
  // def bag_of_words(self, cols, analyzer="word", ngram_range=2)
  bagOfWords: {
    name: 'Bag of Words',
    alias:
      'Method of extracting features from text for use in modeling, such as with machine learning.',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: (
      payload: OperationPayload<{
        analyzer: string;
        ngramRange: [];
      }>
    ): string => {
      return (
        `b{Round} to gr{${payload.analyzer}} decimals` + inColsContent(payload)
      );
    },
    action: (
      payload: OperationPayload<{
        analyzer: string;
        ngramRange: [];
      }>
    ): Source => {
      return payload.source.cols.round({
        target: payload.target,
        cols: payload.cols,
        analyzer: payload.analyzer,
        ngramRange: payload.ngramRange,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    fields: [
      {
        name: 'analyzer',
        label: 'Analyzer',
        type: 'string',
        defaultValue: 0
      },
      {
        name: 'ngram Range',
        label: 'ngram Range',
        type: '[]]',
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
  mod: {
    name: 'Modulo from column values',
    alias: 'module',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: (
      payload: OperationPayload<{
        divisor: number;
      }>
    ): string => {
      return (
        `Get modulo gr{${payload.divisor}} b{Modulo}` + inColsContent(payload)
      );
    },
    action: (
      payload: OperationPayload<{
        divisor: number;
      }>
    ): Source => {
      return payload.source.cols.log({
        target: payload.target,
        cols: payload.cols,
        divisor: payload.divisor,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'cm'
  },
  fingerprint: {
    name: 'Get fingerprint from column values',
    alias: 'fingerprint',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Fingerprint', 'letters'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.fingerprint({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'fs'
  },
  pos: {
    name: 'Get fingerprint from column values',
    alias: 'pos part of speech',
    defaultOptions: {
      usesInputCols: true,
      usesInputDataframe: true,
      preview: 'basic columns'
    },
    content: defaultContentFunction('Part-of-Speech tagger', 'letters'),
    action: (payload: OperationPayload): Source => {
      return payload.source.cols.pos({
        target: payload.target,
        cols: payload.cols,
        outputCols: payload.outputCols,
        requestOptions: payload.requestOptions
      });
    },
    shortcut: 'fs'
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
      preview: 'basic columns',
      usesDiff: true
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
      preview: 'basic columns',
      usesDiff: true
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
    // TODO: Implement preview
    defaultOptions: {
      usesInputDataframe: true
    },
    content: (
      payload: OperationPayload<{
        n: number;
        seed: number;
      }>
    ): string => {
      return `b{Sample} gr{${payload.n}} rows from the dataframe using gr{${payload.seed}} seed`;
    },
    action: (
      payload: OperationPayload<{
        n: number;
        seed: number;
      }>
    ): Source => {
      return payload.source.sample({
        target: payload.target,
        n: payload.n,
        seed: payload.seed,
        requestOptions: payload.requestOptions
      });
    },
    fields: [
      {
        name: 'n',
        label: 'Number of rows',
        type: 'number'
      },
      {
        name: 'seed',
        label: 'Seed',
        type: 'number'
      }
    ],
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
      usesInputCols: { min: 1, max: 1 },
      usesOutputCols: false,
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
      const prefix = payload.options.preview
        ? `__bumblebee__preview__${payload.cols[0]}`
        : payload.prefix;

      return payload.source.cols.oneHotEncode({
        target: payload.target,
        cols: payload.cols,
        prefix,
        drop: payload.drop,
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
  trainModel: {
    name: 'Train model',
    alias: 'train model',
    hidden: context => {
      return !context.appSettings.mlServiceUrl;
    },
    defaultOptions: {
      oneTime: true,
      usesInputCols: { min: 1, max: 1 },
      usesOutputCols: false,
      usesInputDataframe: true,
      targetType: 'void'
    },
    init: async (payload: OperationPayload<PayloadWithOptions>) => {
      const df = payload.source;
      payload.fileName = (await df.getMeta('file_name')) || df.name;

      const columnsProfile = await df.getMeta('profile.columns');

      if (payload.cols?.[0]) {
        const usesFrequency =
          columnsProfile[payload.cols[0]]?.stats?.frequency?.length;
        if (usesFrequency) {
          payload.modelType = 'classification';
        } else {
          payload.modelType = 'regression';
        }
      }

      payload.numericalCols = payload.allColumns.filter(col => {
        return (
          col !== payload.cols[0] &&
          !columnsProfile[col]?.stats?.frequency?.length
        );
      });

      payload.categoricalCols = payload.allColumns.filter(col => {
        return (
          col !== payload.cols[0] &&
          columnsProfile[col]?.stats?.frequency?.length
        );
      });

      payload.models = await getProjectModels(payload);
      payload.preparationCode = await payload.app.getOperationsCode(
        payload.source.name,
        false,
        'df'
      );
      return payload;
    },
    action: async (
      payload: OperationPayload<{
        modelType: string;
        modelName: string;
        newModelName: string;
        fileName: string;
        algorithms: string[];
        preparationCode: string;
        numericalCols: string[];
        categoricalCols: string[];
      }>
    ): Promise<Source> => {
      const df = payload.source;

      const arrayBuffer = await df.saveCsv();
      const fileResponse = await payload.app.uploadFile(
        arrayBuffer,
        payload.fileName
      );

      console.log('[DEBUG] Uploaded file for training', fileResponse);

      if (fileResponse.error) {
        throw new Error(fileResponse.error?.message || 'Unknown error');
      }

      const defaultModelName = `${payload.app.session?.workspace.name} - ${payload.fileName}`;

      const modelName =
        payload.modelName || payload.newModelName || defaultModelName;

      payload.app.addToast({
        title: 'Training model',
        message: `Training model '${modelName}'`,
        type: 'info'
      });

      payload.app
        .post<{
          detail?: string;
        }>('/experiments', {
          name: modelName,
          model_name: modelName,
          target_column: payload.cols[0],
          algorithms: payload.algorithms,
          data_uri: fileResponse.filepath,
          model_type: payload.modelType,
          project_id: payload.app.session?.project.id,
          workspace_id: payload.app.session?.workspace.id,
          preparation_code: payload.preparationCode,
          categorical_features: payload.categoricalCols,
          numerical_features: payload.numericalCols
        })
        .then(response => {
          // TODO: Delete file after experiment is created
          console.log('[DEBUG] Experiment created', response);

          if (response.detail) {
            throw new Error(response.detail);
          }

          payload.app.addToast({
            title: 'Model created',
            message: `Model '${modelName}' created`,
            type: 'success'
          });
        })
        .catch(error => {
          console.error('[DEBUG] Experiment creation failed', error);
          payload.app.addToast({
            title: 'Model creation failed',
            message: `Model '${modelName}' creation failed`,
            type: 'error'
          });
        });

      return df;
    },
    fields: [
      {
        name: 'modelName',
        label: payload =>
          payload.modelName ? 'Retrain created model' : 'Model',
        type: 'string',
        defaultValue: '',
        options: (payload: OperationPayload) => {
          if (!Array.isArray(payload.models)) {
            return [];
          }
          const modelOptions = getModelOptions(
            payload.models,
            payload.app.session?.workspace?.id || ''
          );
          if (modelOptions?.length) {
            return [...modelOptions, { value: '', text: 'Create new model' }];
          }
          return [];
        },
        hidden: (payload: OperationPayload) => {
          return !(payload.models as Array<unknown> | null)?.length;
        }
      },
      {
        name: 'newModelName',
        label: 'New model name',
        type: 'string',
        defaultValue: '',
        placeholder: (payload: OperationPayload) => {
          if (payload.app.session?.workspace.name && payload.fileName) {
            return `${payload.app.session.workspace.name} - ${payload.fileName}`;
          }
          return '';
        },
        hidden: (payload: OperationPayload) => {
          return (
            Boolean((payload.models as Array<unknown> | null)?.length) &&
            (payload.modelName as string) !== ''
          );
        }
      },
      {
        name: 'modelType',
        label: 'Model type',
        type: 'string',
        defaultValue: 'classification',
        options: [
          { value: 'classification', text: 'Classification' },
          { value: 'regression', text: 'Regression' },
          { value: 'clustering', text: 'Clustering' },
          { value: 'time_series', text: 'Time Series' }
          // {value: 'anomaly', text: 'Anomaly'},
        ],
        onChange: (payload, value, oldValue) => {
          const newValue = value as
            | 'classification'
            | 'regression'
            | 'clustering'
            | 'time_series';
          if (value !== oldValue) {
            payload.algorithms = (payload.algorithms || []).filter(algo =>
              algorithmsOptions[newValue].find(algo2 => algo2.value === algo)
            );
            if (
              payload.algorithms.length === 0 &&
              algorithmsOptions[newValue]
            ) {
              payload.algorithms = algorithmsOptions[newValue]
                .filter(algo => algo.default)
                .map(algo => algo.value);
            }
          }
          return payload;
        }
      },
      {
        name: 'algorithms',
        label: 'Algorithms',
        type: 'strings array',
        defaultValue: ['xgboost', 'lightgbm', 'catboost'],
        options: payload => {
          const modelType:
            | 'classification'
            | 'regression'
            | 'clustering'
            | 'time_series' = payload.modelType;
          if (typeof modelType !== 'string') {
            return [];
          }
          return algorithmsOptions[modelType] || [];
        }
      }
    ],
    shortcut: 'mt'
  },
  predict: {
    name: 'Predict using model',
    alias: 'predict model',
    hidden: context => {
      return !context.appSettings.mlServiceUrl;
    },
    defaultOptions: {
      usesInputCols: false,
      usesOutputCols: false,
      usesInputDataframe: true,
      preview: 'custom'
    },
    init: async (payload: OperationPayload<PayloadWithOptions>) => {
      payload.models = await getProjectModels(payload);

      if (!payload.models?.length) {
        throw new Error('No models found. Create a model and try again');
      }

      if (!payload.modelName) {
        payload.modelName = payload.models[0].name;
      }

      return payload;
    },
    content: (
      payload: OperationPayload<{
        modelName: string;
        modelVersion: string;
        outputCol: string;
        includeScore: boolean;
      }>
    ): string => {
      return (
        `b{Predict}` +
        `\nusing gr{${payload.modelName}} with version gr{${payload.modelVersion}}` +
        (payload.includeScore ? `\nand gr{include} score column` : '') +
        `\nto bl{${payload.outputCol || 'prediction'}}` +
        inDataframeContent(payload)
      );
    },
    action: async (
      payload: OperationPayload<{
        modelName: string;
        modelVersion: string;
        outputCol: string;
        includeScore: boolean;
        uploadedFilePath: string;
        driftResponse: any;
      }>
    ): Promise<Source> => {
      payload.outputCol = payload.outputCol || 'prediction';

      if (!payload.modelName) {
        throw new Error('Model name is required');
      }

      const df = payload.source;

      let uploadedFilePath: string;

      if (payload.isUsingSample || !payload.uploadedFilePath) {
        console.log('[DEBUG] Uploading sample for prediction');
        const fileName: string = await df.getMeta('file_name');
        const arrayBuffer = await df.saveCsv();

        const fileResponse = await payload.app.uploadFile(
          arrayBuffer,
          fileName
        );
        // TODO: Delete file after prediction

        if (fileResponse.error) {
          throw new Error(fileResponse.error?.message || 'Unknown error');
        }

        uploadedFilePath = fileResponse.filepath;

        if (!payload.isUsingSample) {
          payload.uploadedFilePath = uploadedFilePath;
        }
      } else {
        uploadedFilePath = payload.uploadedFilePath;
      }

      const response = await payload.app.post<{
        prediction?: string;
        detail?: string;
      }>(
        '/predict',
        {
          data_uri: uploadedFilePath,
          version: payload.modelVersion,
          model_name: payload.modelName,
          model_type: 'classification',
          output: 'json'
        },
        { throwError: false }
      );

      if (response.detail) {
        throw new Error(response.detail);
      }

      if (!response.prediction) {
        console.error(response);
        throw new Error('Result is empty');
      }

      const resultDf = await payload.app.blurr.createDataframe(
        JSON.parse(response.prediction)
      );

      // shallow copy
      const newDf = await df.cols.select({
        target: payload.target,
        requestOptions: payload.requestOptions
      });

      const outputColName = payload.options.preview
        ? '__bumblebee__preview__' + payload.outputCol
        : payload.outputCol;

      return await payload.app.blurr.runCode(
        `${newDf.name}['${outputColName}'] = ${resultDf.name}.data['prediction_label'].values\n` +
          (payload.includeScore
            ? `${newDf.name}['${outputColName}_score'] = ${resultDf.name}.data['prediction_score'].values\n`
            : '') +
          `${newDf.name}`
      );
    },
    fields: [
      {
        name: 'modelName',
        label: 'Model',
        type: 'string',
        options: (payload: OperationPayload) => {
          if (!Array.isArray(payload.models)) {
            return [];
          }
          return (payload.models as ModelResponse[]).map(model => {
            const date = new Date(
              model.last_updated_timestamp
            ).toLocaleString();
            let name = model.tags.model_name || model.name;
            if (
              payload.app.session?.workspace?.id &&
              name.startsWith(payload.app.session.workspace.id + '__')
            ) {
              name = name.replace(payload.app.session.workspace.id + '__', '');
            }
            return {
              value: model.name,
              text: `${name} (${date})`
            };
          });
        },
        onChange: async (payload, value, oldValue) => {
          if (typeof value !== 'string' || value === oldValue) {
            return payload;
          }

          payload.modelVersions = [];
          payload.uploadedFilePath = '';

          const models = payload.models as ModelResponse[];

          const versions = models.find(
            model => model.name === value
          )?.latest_versions;

          if (versions?.length) {
            payload.modelVersions = getModelVersionsOptions(versions);
          }

          console.info('[Predict] Getting model versions from server');

          const url =
            '/models?' +
            new URLSearchParams({
              model_name: value || ''
            });

          const response = await payload.app.get<
            {
              version: string;
              last_updated_timestamp: number;
            }[]
          >(url, { throwError: true });

          console.log('[DEBUG] Model versions requested', response);

          payload.modelVersions = response.map(model => ({
            value: model.version,
            text: `${model.version} (${new Date(
              model.last_updated_timestamp
            ).toLocaleString()})`,
            data: model
          }));

          if (
            !payload.modelVersion ||
            !(payload.modelVersions as { value: string }[]).find(
              version => version.value === payload.modelVersion
            )
          ) {
            payload.modelVersion = payload.modelVersions[0].value;
          }

          return payload;
        }
      },
      {
        name: 'modelVersion',
        label: 'Model version',
        type: 'string',
        defaultValue: 'latest',
        options: (payload: OperationPayload) => {
          return payload.modelVersions as { value: string; text: string }[];
        },
        onChange: async (payload, value, oldValue) => {
          if (!payload.modelName || !value || value === 'latest') {
            return payload;
          }

          const newDriftRequest = `${payload.modelName} ${payload.modelVersion}`;

          if (
            newDriftRequest === payload.driftRequest &&
            payload.uploadedFilePath
          ) {
            return payload;
          }

          payload.driftRequest = newDriftRequest;

          console.log(
            `[DEBUG] Uploading dataset for drifting and prediction '${newDriftRequest}'`
          );

          const df = payload.source;

          const fileName: string = await df.getMeta('file_name');
          const arrayBuffer = await df.saveCsv();

          const fileResponse = await payload.app.uploadFile(
            arrayBuffer,
            fileName
          );

          payload.uploadedFilePath = fileResponse.filepath;

          const response = await payload.app.post<{
            drift?: string;
            detail?: string;
          }>(
            '/drift',
            {
              data_uri: fileResponse.filepath,
              model_name: payload.modelName,
              model_version: payload.modelVersion
            },
            { throwError: false }
          );

          if (response.detail) {
            console.error('Error getting drift', response.detail);
            payload.app.addToast({
              type: 'error',
              title: 'Error getting drift'
            });
          }

          if (response.drift) {
            payload.driftResponse = JSON.parse(response.drift);
          }

          return payload;
        }
      },
      {
        name: 'outputCol',
        label: 'Output column',
        type: 'string',
        defaultValue: 'prediction'
      },
      {
        name: 'includeScore',
        label: 'Include score column',
        type: 'boolean'
      },
      {
        name: 'performanceTable',
        defaultValue: payload => {
          const info = (payload.modelVersions || []).find(
            version => version.value === payload.modelVersion
          )?.data;

          if (!info?.tags) {
            return null;
          }
          return {
            title: 'Performance',
            header: ['Metric', 'Value'],
            values: [
              [`F1`, info.tags.f1],
              [`MCC`, info.tags.mcc],
              [`Accuracy`, info.tags.accuracy],
              [`Time Taken (sec)`, info.tags.time_taken_sec],
              [`AUC`, info.tags.auc],
              [`Precision`, info.tags.precision],
              [`Kappa`, info.tags.kappa]
            ]
            // `Version: ${info.version}\n` +
            // `Created: ${new Date(info.creation_timestamp).toLocaleString()}\n` +
            // `Updated: ${new Date(
            //   info.last_updated_timestamp
            // ).toLocaleString()}\n` +
          };
        },
        hidden: payload => {
          return !(payload.modelVersions || []).find(
            version => version.value === payload.modelVersion
          );
        },

        type: 'table'
      },
      {
        name: 'driftTable',
        defaultValue: payload => {
          return getDriftTableData(payload.driftResponse);
        },
        hidden: payload => {
          const info = payload.driftResponse;

          if (!info?.metrics?.length) {
            return true;
          }

          const dataDriftTable = info.metrics.find(
            metric => metric.metric === 'DataDriftTable'
          )?.result;

          if (!dataDriftTable) {
            return true;
          }
          return false;
        },

        type: 'table'
      }
    ],
    shortcut: 'mp'
  },

  //
  unnestColumns: {
    name: 'Unnest columns',
    alias: 'Split cols unnest',
    defaultOptions: {
      usesInputCols: { min: 1, max: 1 },
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
        : payload.outputCols[0];

      return payload.source.cols.unnest({
        target: payload.target,
        cols: payload.cols[0],
        outputCols: outputCols !== payload.cols[0] ? outputCols : undefined,
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
        label: 'Drop input column',
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
      usesOutputCols: false,
      usesInputDataframe: true,
      preview: 'custom'
    },
    content: (
      payload: OperationPayload<{
        separator: string;
        drop: boolean;
      }>
    ): string => {
      return (
        `b{Nest} ${naturalJoin(payload.cols)}` +
        ` using gr{${payload.separator}}` +
        inDataframeContent(payload) +
        ` and ${payload.drop ? 'gr{drop}' : 'gr{keep}'} original columns`
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
        drop: boolean;
      }>
    ): Source => {
      const drop = payload.options.preview ? false : payload.drop;
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
      },
      {
        name: 'drop',
        label: 'Drop input columns',
        type: 'boolean',
        defaultValue: false
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

  if ((options.preview || '').startsWith('basic columns')) {
    if (payload.cols?.length) {
      payload = {
        ...payload,
        outputCols: (payload.cols as Cols).map(
          col => `__bumblebee__preview__${col}`
        )
      };
    } else if (Array.isArray(payload.sets)) {
      payload = {
        ...payload,
        sets: payload.sets.map((set: object, index) => ({
          ...set,
          col: `${index}`
        }))
      };
    }
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

const createOperation = (
  operationCreator: OperationCreator,
  operationKey: string
): Operation => {
  if ('uses' in operationCreator) {
    const foundOperation = operationCreators[operationCreator.uses];
    if (!foundOperation) {
      throw new Error(`Operation ${operationCreator.uses} not found`);
    }

    const operation = createOperation(
      {
        ...foundOperation,
        disabled: operationCreator.disabled,
        hidden: operationCreator.hidden,
        shortcut: operationCreator.shortcut,
        name: operationCreator.name,
        alias: operationCreator.alias,
        description: operationCreator.description
      },
      operationKey
    );

    const words = `${operation.name} ${operation.alias || ''}`.split(' ');

    operation.words = [
      ...new Set([
        ...words,
        ...words.map(word => word.replace(/[^a-zA-Z0-9]/g, '')),
        ...words.map(word => word.replace(/[^a-zA-Z0-9]/g, ' ').split(' '))
      ])
    ].flat();

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
      Object.keys(operationCreator.defaultPayload).forEach(key => {
        if (!operation.fields.find(field => field.name === key)) {
          operation.fields.push({
            name: key,
            type: 'hidden',
            defaultValue: operationCreator.defaultPayload?.[key]
          });
        }
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return operation as any;
  }

  const operation = { ...operationCreator } as Operation;
  operation.key = operationKey;
  operation.fields = [...(operationCreator.fields || [])];
  operation.defaultOptions = Object.assign(
    { targetType: 'dataframe' },
    operationCreator.defaultOptions || {}
  );

  const words = `${operation.name} ${operation.alias || ''}`.split(' ');

  operation.words = [
    ...new Set([
      ...words,
      ...words.map(word => word.replace(/[^a-zA-Z0-9]/g, '')),
      ...words.map(word => word.replace(/[^a-zA-Z0-9]/g, ' ').split(' '))
    ])
  ].flat();

  operation.validate = async (
    payload: OperationPayload<PayloadWithOptions>
  ) => {
    try {
      if (operationCreator.validate) {
        payload = preparePayloadForAction(operation, payload);
        return await operationCreator.validate(payload);
      }
    } catch (err) {
      if (
        operationCreator.handleError &&
        err &&
        (err instanceof Error || typeof err === 'string')
      ) {
        throw operationCreator.handleError(err, payload);
      }
      throw err;
    }
    return true;
  };

  operation.action = async (payload: OperationPayload<PayloadWithOptions>) => {
    try {
      payload = preparePayloadForAction(operation, payload);
      if (operationCreator.validate?.(payload) === false) {
        throw new Error('Validation failed');
      }
      return await operationCreator.action(payload);
    } catch (err) {
      if (
        operationCreator.handleError &&
        err &&
        (err instanceof Error || typeof err === 'string')
      ) {
        throw operationCreator.handleError(err, payload);
      }
      throw err;
    }
  };

  return operation;
};

const getProjectModels = async (
  payload: OperationPayload<PayloadWithOptions>
) => {
  try {
    const url =
      '/projects/models?' +
      new URLSearchParams({
        project_id: payload.app.session?.project.id || ''
      });
    const response = await payload.app.get<
      | {
          detail?: string;
        }
      | ModelResponse[]
    >(url, { throwError: false });
    if (!Array.isArray(response)) {
      if (response.detail) {
        throw new Error(response.detail);
      }
      throw new Error('Unknown error');
    }
    return response;
  } catch (err) {
    console.error('Error getting project models', err);
    return [];
  }
};

const algorithmsOptions = {
  classification: [
    { value: 'lr', text: 'Logistic Regression' },
    { value: 'knn', text: 'K Neighbors Classifier' },
    { value: 'nb', text: 'Naive Bayes' },
    { value: 'dt', text: 'Decision Tree Classifier' },
    { value: 'svm', text: 'SVM - Linear Kernel' },
    { value: 'rbfsvm', text: 'SVM - Radial Kernel' },
    { value: 'gpc', text: 'Gaussian Process Classifier' },
    { value: 'mlp', text: 'MLP Classifier' },
    { value: 'ridge', text: 'Ridge Classifier' },
    { value: 'rf', text: 'Random Forest Classifier' },
    { value: 'qda', text: 'Quadratic Discriminant Analysis' },
    { value: 'ada', text: 'Ada Boost Classifier' },
    { value: 'gbc', text: 'Gradient Boosting Classifier' },
    { value: 'lda', text: 'Linear Discriminant Analysis' },
    { value: 'et', text: 'Extra Trees Classifier' },
    { value: 'xgboost', text: 'Extreme Gradient Boosting', default: true },
    {
      value: 'lightgbm',
      text: 'Light Gradient Boosting Machine',
      default: true
    },
    { value: 'catboost', text: 'CatBoost Classifier', default: true }
  ],
  regression: [
    { value: 'lr', text: 'Linear Regression' },
    { value: 'lasso', text: 'Lasso Regression' },
    { value: 'ridge', text: 'Ridge Regression' },
    { value: 'en', text: 'Elastic Net' },
    { value: 'lar', text: 'Least Angle Regression' },
    { value: 'llar', text: 'Lasso Least Angle Regression' },
    { value: 'omp', text: 'Orthogonal Matching Pursuit' },
    { value: 'br', text: 'Bayesian Ridge' },
    { value: 'ard', text: 'Automatic Relevance Determination' },
    { value: 'par', text: 'Passive Aggressive Regressor' },
    { value: 'ransac', text: 'Random Sample Consensus' },
    { value: 'tr', text: 'TheilSen Regressor' },
    { value: 'huber', text: 'Huber Regressor' },
    { value: 'kr', text: 'Kernel Ridge' },
    { value: 'svm', text: 'Support Vector Regression' },
    { value: 'knn', text: 'K Neighbors Regressor' },
    { value: 'dt', text: 'Decision Tree Regressor' },
    { value: 'rf', text: 'Random Forest Regressor' },
    { value: 'et', text: 'Extra Trees Regressor' },
    { value: 'ada', text: 'AdaBoost Regressor' },
    { value: 'gbr', text: 'Gradient Boosting Regressor' },
    { value: 'mlp', text: 'MLP Regressor' },
    { value: 'xgboost', text: 'Extreme Gradient Boosting', default: true },
    {
      value: 'lightgbm',
      text: 'Light Gradient Boosting Machine',
      default: true
    },
    { value: 'catboost', text: 'CatBoost Classifier', default: true }
  ],
  clustering: [
    { value: 'kmeans', text: 'K-Means Clustering', default: true },
    { value: 'ap', text: 'Affinity Propagation' },
    { value: 'meanshift', text: 'Mean shift Clustering' },
    { value: 'sc', text: 'Spectral Clustering' },
    { value: 'hclust', text: 'Agglomerative Clustering' },
    {
      value: 'dbscan',
      text: 'Density-Based Spatial Clustering',
      default: true
    },
    { value: 'optics', text: 'OPTICS Clustering' },
    { value: 'birch', text: 'Birch Clustering' },
    { value: 'kmodes', text: 'K-Modes Clustering' }
  ],
  time_series: [
    { value: 'naive', text: 'Naive Forecaster' },
    { value: 'grand_means', text: 'Grand Means Forecaster' },
    {
      value: 'snaive',
      text: 'Seasonal Naive Forecaster (disabled when seasonal_period = 1)'
    },
    { value: 'polytrend', text: 'Polynomial Trend Forecaster' },
    {
      value: 'arima',
      text: 'ARIMA family of models (ARIMA, SARIMA, SARIMAX)',

      default: true
    },
    { value: 'auto_arima', text: 'Auto ARIMA' },
    { value: 'exp_smooth', text: 'Exponential Smoothing', default: true },
    { value: 'stlf', text: 'STL Forecaster' },
    { value: 'croston', text: 'Croston Forecaster' },
    { value: 'ets', text: 'ETS' },
    { value: 'theta', text: 'Theta Forecaster' },
    { value: 'tbats', text: 'TBATS' },
    { value: 'bats', text: 'BATS' },
    { value: 'prophet', text: 'Prophet Forecaster', default: true },
    {
      value: 'lr_cds_dt',
      text: 'Linear w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'en_cds_dt',
      text: 'Elastic Net w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'ridge_cds_dt',
      text: 'Ridge w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'lasso_cds_dt',
      text: 'Lasso w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'llar_cds_dt',
      text: 'Lasso Least Angular Regressor w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'br_cds_dt',
      text: 'Bayesian Ridge w/ Cond. Deseasonalize & Deseasonalize & Detrending'
    },
    {
      value: 'huber_cds_dt',
      text: 'Huber w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'omp_cds_dt',
      text: 'Orthogonal Matching Pursuit w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'knn_cds_dt',
      text: 'K Neighbors w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'dt_cds_dt',
      text: 'Decision Tree w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'rf_cds_dt',
      text: 'Random Forest w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'et_cds_dt',
      text: 'Extra Trees w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'gbr_cds_dt',
      text: 'Gradient Boosting w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'ada_cds_dt',
      text: 'AdaBoost w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'lightgbm_cds_dt',
      text: 'Light Gradient Boosting w/ Cond. Deseasonalize & Detrending'
    },
    {
      value: 'catboost_cds_dt',
      text: 'CatBoost w/ Cond. Deseasonalize & Detrending'
    }
  ]
};

export const operations: Record<string, Operation> = objectMap(
  operationCreators,
  createOperation
);

function whereExpression(
  condition: string,
  payload: {
    value: BasicType;
    otherValue?: BasicType;
    values?: BasicType[];
    mode?: number;
  },
  col: string
): string {
  let { value, values } = payload;
  const { otherValue } = payload;
  const mode = payload.mode || 0;

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
    case 'match_pattern':
      return `(df.cols.pattern("${col}", mode=${mode})["${col}"]=="${value}")`;
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
    case 'match_pattern':
      return `matches pattern`;
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
      reject(new Error('Error reading file'));
    });

    readChunk();
  });
};

function downloadArrayBuffer(arrayBuffer: ArrayBuffer, fileName: string) {
  const blob = new Blob([arrayBuffer], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// error handling

export class FieldsError extends Error {
  fieldMessages: Record<string, string>;
  constructor(message: string, fieldMessages: Record<string, string> = {}) {
    super(message);
    this.name = 'FieldsError';
    this.fieldMessages = fieldMessages;
  }
}

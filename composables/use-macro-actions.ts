import { useApolloClient } from '@vue/apollo-composable';

import {
  CREATE_MACRO,
  DELETE_MACRO,
  GET_MACRO,
  GET_MACROS
} from '@/api/queries';
import { Macro } from '@/types/app';
import { DataframeObject } from '@/types/dataframe';
import {
  OperationItem,
  OperationPayload,
  PayloadWithOptions
} from '@/types/operations';
import { operations, preparePayloadWithSourceData } from '@/utils/operations';

const AppInput = resolveComponent('AppInput');

const { confirm } = useConfirmPopup();
const { addToast } = useToasts();

const adaptOperationCellsToMacro = (operationItems: OperationItem[]) => {
  const macro: Macro = {
    operations: [],
    sources: [],
    newSources: []
  };

  operationItems.forEach(operationCell => {
    const { operation, payload } = operationCell;

    const newPayload: PayloadWithOptions = {
      ...payload
    };

    newPayload.sourceName = payload.source?.name;

    // if source is not already on sources list, add it

    if (
      payload.source &&
      !macro.newSources.find(s => s.name === payload.source.name) &&
      !macro.sources.find(s => s.name === payload.source.name)
    ) {
      macro.sources.push({
        name: payload.source.name,
        cols: payload.allColumns
      });
    }

    if (payload.target && payload.target !== payload.source?.name) {
      macro.newSources.push({
        name: payload.target,
        cols: []
      });
    }

    (
      [
        'allColumns',
        'allDataframes',
        'app',
        'otherDataframes',
        'requestOptions',
        'isUsingSample',
        'source',
        'operationStatus'
      ] as const
    ).forEach(key => {
      delete newPayload[key];
    });

    macro.operations.push({
      operationKey: operation.key,
      payload: newPayload as OperationPayload
    });
  });

  return macro;
};

export default function () {
  const { resolveClient } = useApolloClient();
  const apolloClient = resolveClient();

  const saveMacro = async (operations: OperationItem[]): Promise<boolean> => {
    const date = new Date();

    const name =
      'macro-' +
      [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      ].join('-');

    const result = await confirm({
      title: 'Save macro',
      acceptLabel: 'Save',
      fields: [
        {
          component: AppInput,
          name: 'name',
          placeholder: name,
          label: 'Macro name'
        }
      ]
    });

    if (typeof result !== 'object' || !result) {
      return false;
    }

    const mutationResult = await apolloClient.mutate({
      mutation: CREATE_MACRO,
      variables: {
        name: result.name || name,
        macro: adaptOperationCellsToMacro(operations)
      }
    });

    if (mutationResult?.data?.insert_macros_one) {
      addToast({
        title: 'Macro saved',
        type: 'success'
      });
      return true;
    } else {
      console.error('Error saving macro', mutationResult);
      addToast({
        title: 'Error saving macro',
        type: 'error'
      });
      return false;
    }
  };

  const getMacro = async (id: string) => {
    const { data } = await apolloClient.query<{
      macros_by_pk: { macro: Macro };
    }>({
      query: GET_MACRO,
      variables: {
        id
      }
    });

    return data?.macros_by_pk?.macro;
  };

  const getMacros = async (page = 0): Promise<Partial<Macro>[]> => {
    const result = await apolloClient.query<{
      macros: Partial<Macro>[];
    }>({
      query: GET_MACROS,
      variables: {
        limit: 1000,
        offset: page * 1000
      }
    });

    return result.data.macros;
  };

  const applyMacro = (
    macro: Macro,
    operationItems: OperationItem[],
    dataframes: DataframeObject[],
    allDataframes: DataframeObject[]
  ) => {
    if (macro.sources.length > dataframes.length) {
      console.log('Error applying macro', { macro, dataframes });
      addToast({
        title: 'Error applying macro',
        message: 'The macro has more sources than the current workspace',
        type: 'error'
      });
      return;
    }

    const allDataframeNames = allDataframes.map(s => s.df.name);

    const newTargetsMap: Record<string, string> = {};

    return [
      ...(operationItems || []),
      ...macro.operations.map(operationItem => {
        const index = macro.sources.findIndex(
          s => s.name === operationItem.payload.sourceName
        );

        const dataframeObject = index > -1 ? dataframes[index] : null;

        const newPayload: Partial<PayloadWithOptions> = {
          ...operationItem.payload,
          source: dataframeObject?.df
        };

        if (
          newPayload.target &&
          newPayload.target !== newPayload.sourceName &&
          macro.newSources.find(s => s.name === newPayload.target)
        ) {
          const previousName = newPayload.target;
          newPayload.target =
            newTargetsMap[previousName] ||
            getUniqueName('df', [
              ...allDataframeNames,
              ...Object.values(newTargetsMap)
            ]);

          if (!newTargetsMap[previousName]) {
            newTargetsMap[previousName] = newPayload.target;
          }
        }

        delete newPayload.sourceName;

        const operation = operations[operationItem.operationKey];

        const completePayload = preparePayloadWithSourceData(
          newPayload,
          operation,
          dataframes,
          index
        ) as PayloadWithOptions;

        completePayload.options.sourceId = dataframeObject?.sourceId;

        completePayload.options.preview = false;

        return {
          operation,
          payload: completePayload
        };
      })
    ];

    // adapt macro to current workspace
  };

  const getAndApplyMacro = async (
    id: string,
    operationItems: OperationItem[],
    dataframes: DataframeObject[],
    allDataframes: DataframeObject[]
  ) => {
    const macro = await getMacro(id);

    if (!macro) {
      return;
    }

    return await applyMacro(macro, operationItems, dataframes, allDataframes);
  };

  const deleteMacro = async (id: string) => {
    const result = await confirm('Delete macro');

    if (!result) {
      return;
    }

    const { data } = await apolloClient.mutate<{
      delete_macros_by_pk: { macro: Macro };
    }>({
      mutation: DELETE_MACRO,
      variables: {
        id
      }
    });

    if (data?.delete_macros_by_pk?.macro) {
      addToast({
        title: 'Macro deleted',
        type: 'success'
      });
    }

    return data?.delete_macros_by_pk?.macro;
  };

  return {
    saveMacro,
    getMacro,
    getMacros,
    getAndApplyMacro,
    deleteMacro
  };
}

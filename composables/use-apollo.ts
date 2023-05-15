import { useLazyQuery as originalUseLazyQuery } from '@vue/apollo-composable';
export { useQuery, useMutation } from '@vue/apollo-composable';

type UseQueryArgs<TResult, TVariables> = Parameters<
  typeof originalUseLazyQuery<TResult, TVariables>
>;
type DocumentParameters<TResult, TVariables> = UseQueryArgs<
  TResult,
  TVariables
>[0];
type VariablesParameters<TVariables> = UseQueryArgs<unknown, TVariables>[1];
type OptionsParameters<TResult, TVariables> = UseQueryArgs<
  TResult,
  TVariables
>[2];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useClientQuery = <TResult = any, TVariables = any>(
  document: DocumentParameters<TResult, TVariables>,
  variables: VariablesParameters<TVariables>,
  options: OptionsParameters<TResult, TVariables> = {}
) => {
  const queryResult = originalUseLazyQuery<TResult, TVariables>(
    document,
    variables,
    options
  );
  watch(
    queryResult.result,
    () => {
      if (process.client && queryResult.result.value === undefined) {
        queryResult.load();
      }
    },
    { immediate: true }
  );
  return queryResult;
};

export const useLazyQuery = originalUseLazyQuery;

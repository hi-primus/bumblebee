import { isObject } from './common';

interface FieldOption {
  value: string;
  text: string;
}

interface Field {
  name: string;
  type: string;
  key?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  options?: FieldOption[];
  description?: string;
  defaultValue?: unknown;
}

export interface OperationCreator<TA, TR> {
  name: string;
  description?: string;
  fields?: Field[];
  usesInputCols?: boolean;
  usesOutputCols?: boolean;
  usesInputDataframe?: boolean;
  targetType?: 'dataframe' | 'value';
  action: (payload: TA) => TR;
}

export type Operation<
  TA = any,
  TR = any
> = SomeRequired<OperationCreator<TA, TR>, 'targetType' | 'fields'>;

export type ColumnDetailState = {
  columns: string[];
};

export type State = Operation | ColumnDetailState | 'operations' | null;

export const isOperation = (value: unknown): value is Operation => {
  return (
    isObject(value) &&
    'targetType' in value &&
    'fields' in value &&
    typeof value.targetType === 'string' &&
    Array.isArray(value.fields) &&
    ['dataframe', 'value'].includes(value.targetType)
  );
};

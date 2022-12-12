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

export interface OperationOptions {
  usesInputCols?: boolean;
  usesOutputCols?: boolean;
  usesInputDataframe?: boolean;
  saveToNewDataframe?: boolean;
  targetType: 'dataframe' | 'value';
}

export interface OperationCreator<TA, TR> {
  name: string;
  description?: string;
  fields?: Field[];
  defaultOptions?: OperationOptions;
  action: (payload: TA) => TR;
}

export type Operation<
  TA = any,
  TR = any
> = SomeRequired<OperationCreator<TA, TR>, 'defaultOptions' | 'fields'>;

export const isOperation = (value: unknown): value is Operation => {
  return (
    isObject(value) &&
    'defaultOptions' in value &&
    'fields' in value &&
    Array.isArray(value.fields) &&
    isObject(value.defaultOptions) &&
    'targetType' in value.defaultOptions &&
    typeof value.defaultOptions.targetType === 'string' &&
    ['dataframe', 'value'].includes(value.defaultOptions.targetType)
  );
};

export type ColumnDetailState = {
  columns: string[];
};

export type Payload = Record<string, any>;

export type State = Operation | ColumnDetailState | 'operations' | null;

export interface OperationActions {
  submitOperation: () => void;
  cancelOperation: () => void;
}
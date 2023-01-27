import { isObject } from './common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Payload = Record<string, any>;

type PayloadCalbackOr<T> = T | ((payload: Payload) => T);
export interface Field {
  name: string;
  type: 'string' | 'boolean' | 'custom';
  key?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  options?: PayloadCalbackOr<Record<string, unknown>[]>;
  textCallback?: (value: unknown) => string;
  description?: string;
  defaultValue?: unknown;
  class?: string;
}

export interface FieldGroup {
  name: string;
  fields: Field[];
  type: 'group';
  label?: string;
  addLabel?: string;
  class?: string;
}

export type PreviewType = boolean | 'basic columns' | 'whole'; // TODO: add preview types

export interface OperationOptions {
  usesInputCols?: boolean | 'single';
  usesOutputCols?: boolean;
  usesInputDataframe?: boolean;
  saveToNewDataframe?: boolean;
  sourceId?: string;
  targetType: 'dataframe' | 'value';
  preview?: PreviewType;
}

export interface OperationCreatorBase {
  key: string;
  name: string;
  alias?: string;
  description?: string;
  fields?: (Field | FieldGroup)[];
  defaultOptions?: Partial<OperationOptions>;
  shortcut?: string;
}

type OperationCreatorAction = OperationCreatorBase & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any) => any;
};

type OperationCreatorParameters = OperationCreatorBase & {
  uses: string;
  defaultPayload?: Record<string, unknown>;
};

export type OperationCreator =
  | OperationCreatorAction
  | OperationCreatorParameters;

export type Operation = OperationCreatorAction & {
  defaultOptions: OperationOptions;
  fields: (Field | FieldGroup)[];
};

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

export type OperationPayload = { operation: Operation; payload: Payload };

export type ColumnDetailState = {
  columns: string[];
};

export type State = Operation | ColumnDetailState | 'operations';

export interface ColumnsSelection {
  columns: string[];
  ranges: null;
  values: null;
  indices: null;
}

export interface RangesSelection {
  columns: [string];
  ranges: [number, number][];
  values: null;
  indices: number[];
}

export interface ValuesSelection {
  columns: [string];
  ranges: null;
  values: BasicType[];
  indices: number[];
}

export type TableSelection =
  | ColumnsSelection
  | RangesSelection
  | ValuesSelection
  | null;

export interface OperationActions {
  submitOperation: () => Promise<void>;
  cancelOperation: () => void;
}

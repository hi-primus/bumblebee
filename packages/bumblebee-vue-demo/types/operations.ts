import { Source } from 'blurr/build/main/types';

import { isObject } from './common';

export type PreviewType =
  | boolean
  | 'basic columns'
  | 'whole'
  | 'rows'
  | 'highlight rows'; // TODO: add preview types

export interface OperationOptions {
  usesInputCols?: boolean | 'single';
  usesOutputCols?: boolean;
  usesInputDataframe?: boolean;
  saveToNewDataframe?: boolean;
  oneTime?: boolean;
  sourceId?: string;
  targetType: 'dataframe' | 'value' | 'void';
  preview?: PreviewType;
  editing?: number;
}

export interface PayloadWithOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  options: OperationOptions;
}

export type Payload = Partial<PayloadWithOptions>;

type PayloadCallbackOr<T> =
  | T
  | ((payload: PayloadWithOptions, currentIndex?: number) => T);

export type FieldOption<T = unknown> = Record<string, T> & {
  disabled?: boolean;
  hidden?: boolean;
};

export interface SuggestionParameter {
  type: string; // TODO: add types
  name: string;
  description: string;
  required?: boolean;
}
export type SuggestionColumn = {
  type: 'column';
  name: string;
  value: string;
};

export type SuggestionFunction = {
  type: 'function';
  name: string;
  value: string;
  parameters: SuggestionParameter;
  description: string;
  example: string;
};

export type Suggestion = SuggestionColumn | SuggestionFunction;

export interface Field {
  name: string;
  type: PayloadCallbackOr<
    'string' | 'number' | 'boolean' | 'custom' | 'strings array' | 'file'
  >;
  key?: string;
  placeholder?: string;
  label?: PayloadCallbackOr<string>;
  required?: PayloadCallbackOr<boolean>;
  options?: PayloadCallbackOr<(string | FieldOption<unknown>)[]>;
  suggestions?: PayloadCallbackOr<Suggestion[]>;
  textCallback?: (value: unknown) => string;
  description?: string;
  defaultValue?: unknown;
  class?: PayloadCallbackOr<string>;
  disabled?: PayloadCallbackOr<boolean>;
  hidden?: PayloadCallbackOr<boolean>;
}

export interface FieldGroup {
  name: string;
  fields: Field[];
  defaultFields?: number;
  type: 'group';
  label?: string;
  addLabel?: string;
  class?: string;
  groupConnector?: string;
}

export interface OperationCreatorBase {
  name: string;
  alias?: string;
  description?: string;
  fields?: (Field | FieldGroup)[];
  defaultOptions?: Partial<OperationOptions>;
  shortcut?: string;
}

type OperationCreatorAction = OperationCreatorBase & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validate?: (...args: any) => PromiseOr<boolean | string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  action: (...args: any) => PromiseOr<Source>;
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

export const isOperation = (
  value: unknown,
  other?: Operation
): value is Operation => {
  const isOperation =
    isObject(value) &&
    'defaultOptions' in value &&
    'fields' in value &&
    Array.isArray(value.fields) &&
    isObject(value.defaultOptions) &&
    'targetType' in value.defaultOptions &&
    typeof value.defaultOptions.targetType === 'string' &&
    ['dataframe', 'value'].includes(value.defaultOptions.targetType);
  if (!isOperation) return false;
  if (other) {
    return (
      value.name === other.name &&
      value.alias === other.alias &&
      value.description === other.description &&
      value.shortcut === other.shortcut
    );
  }
  return true;
};

export type OperationPayload = {
  operation: Operation;
  payload: PayloadWithOptions;
};

export type OperationStatus = {
  message?: string;
  status: 'not validated' | 'ok' | 'warning' | 'error' | 'fatal error';
};

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
  cancelOperation: (restoreInactive: boolean) => void;
  selectOperation: (
    operation: Operation | null,
    payload?: Partial<PayloadWithOptions>
  ) => void;
}

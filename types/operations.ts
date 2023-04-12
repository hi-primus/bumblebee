/* eslint-disable @typescript-eslint/no-explicit-any */

import { AppFunctions } from './app';
import { isObject } from './common';

import { Client, Source } from '@/types/blurr';

export type PreviewType =
  | false
  | 'custom'
  | 'basic columns'
  | 'whole'
  | 'whole no-profile'
  | 'rows'
  | 'highlight rows';

export interface OperationOptions {
  usesInputCols?: boolean | 'single';
  usesOutputCols?: boolean | 'required';
  usesInputDataframe?: boolean;
  saveToNewDataframe?: boolean;
  oneTime?: boolean;
  sourceId?: string;
  targetType: 'dataframe' | 'value' | 'void';
  preview?: PreviewType;
  editing?: number;
}

export interface PayloadWithOptions {
  [key: string]: any;
  options: OperationOptions;
}

export type Payload = Partial<PayloadWithOptions>;

export type Cols = string[];

export type OperationPayload<
  T extends Record<string, unknown> = Record<string, unknown>
> = {
  blurr: Client;
  source: Source;
  target: string;
  cols: Cols;
  allColumns: Cols;
  allDataframes: {
    name: string;
    columns: Cols;
    df: Source;
  }[];
  otherDataframes: {
    name: string;
    columns: Cols;
    df: Source;
  }[];
  outputCols: Cols;
  options: OperationOptions;
  app: AppFunctions;
} & T;

export type PayloadCallbackOr<T> =
  | T
  | ((
      payload: OperationPayload<PayloadWithOptions>,
      currentIndex?: number
    ) => T);

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

type CompatibleType = BasicType | any[] | Record<string, any>;

export interface BasicField {
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
  defaultValue?: PayloadCallbackOr<CompatibleType>;
  class?: PayloadCallbackOr<string>;
  disabled?: PayloadCallbackOr<boolean>;
  hidden?: PayloadCallbackOr<boolean>;
}

export interface SpecialField {
  name: string;
  type: 'join'; // TODO: add 'concat'
}

export interface FieldGroup {
  name: string;
  fields: BasicField[];
  defaultFields?: number;
  type: 'group';
  label?: string;
  addLabel?: string;
  class?: string;
  groupConnector?: string;
}

export type Field = BaiscField | SpecialField | FieldGroup;

export interface OperationCreatorBase {
  name: string;
  title?: PayloadCallbackOr<string>;
  content?: (...args: any) => string;
  alias?: string;
  description?: string;
  fields?: (Field | SpecialField | FieldGroup)[];
  defaultOptions?: Partial<OperationOptions>;
  shortcut?: string;
}

type OperationCreatorAction = OperationCreatorBase & {
  // validates whether the operation can be performed on a dataset.
  validate?: (...args: any) => PromiseOr<boolean | string>;
  // performs the operation on a dataset and returns the modified dataset.
  action: (...args: any) => PromiseOr<Source>;
};

type OperationCreatorParameters = OperationCreatorBase & {
  uses: string;
  defaultPayload?: Record<string, CompatibleType>;
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

export type OperationItem = {
  operation: Operation;
  payload: PayloadWithOptions;
};

export type OperationStatus = {
  message?: string;
  status: 'not validated' | 'ok' | 'error' | 'fatal error';
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

type JoinDataColumn = {
  name: string;
  selected: boolean;
  isKey: boolean;
};

export type JoinData = {
  left: JoinDataColumn[];
  right: JoinDataColumn[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */

import { AppProperties, AppSettings } from './app';
import { isObject } from './common';

import { RequestOptions, Source } from '@/types/blurr';

export type PreviewType =
  | false
  | 'custom'
  | 'custom no-sample'
  | 'basic columns'
  | 'basic columns no-sample'
  | 'dataframe'
  | 'dataframe no-profile'
  | 'rows'
  | 'highlight rows';

interface InputColsOptions {
  required?: boolean;
  min?: number;
  max?: number;
  label?: string;
}

export interface OperationOptions {
  usesInputCols?: boolean | InputColsOptions;
  usesOutputCols?: boolean | 'required';
  usesInputDataframe?: boolean;
  usesDiff?: boolean;
  saveToNewDataframe?: boolean | 'required';
  oneTime?: boolean;
  sourceId?: string;
  newSourceId?: string;
  targetType: 'dataframe' | 'value' | 'void';
  preview?: PreviewType;
  editing?: number;
  containerClass?: string;
  usesDialog?: boolean;
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
  source: Source;
  target: string;
  cols: Cols;
  allColumns: Cols;
  allDataframes: {
    sourceId: string;
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
  app: AppProperties;
  requestOptions: RequestOptions;
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

interface FieldActionButton {
  label: string;
  icon: string;
  action: (payload: OperationPayload<PayloadWithOptions>) => PromiseOr<void>;
}

export interface BasicField {
  name: string;
  type: PayloadCallbackOr<
    | 'string'
    | 'number'
    | 'boolean'
    | 'custom'
    | 'multiline string'
    | 'strings array'
    | 'file'
    | 'hidden'
    | 'message'
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
  actionButton?: FieldActionButton;
  onChange?: (
    payload: OperationPayload<PayloadWithOptions>,
    value: unknown,
    oldValue: unknown
  ) => PromiseOr<Record<string, CompatibleType> | null>;
  rules?: ((value: string) => boolean | string)[];
}

export interface SpecialField {
  name: string;
  type: 'join' | 'concat';
  defaultValue?: PayloadCallbackOr<CompatibleType>;
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

export type Field = BasicField | SpecialField | FieldGroup;

export interface ColumnsSelection {
  columns: string[];
  ranges?: null;
  values?: null;
  indices?: null;
  pattern?: null;
}

export interface RangesSelection {
  columns: [string];
  ranges: [number, number][];
  values?: null;
  indices: number[];
  pattern?: null;
}

export interface ValuesSelection {
  columns: [string];
  ranges?: null;
  values: BasicType[];
  indices: number[];
  pattern?: null;
}

export interface QualitySelection {
  columns: [string];
  ranges?: null;
  values: 'missing' | 'match' | 'mismatch';
  indices?: null;
  pattern?: null;
}

export interface PatternsSelection {
  columns: [string];
  ranges?: null;
  values?: null;
  indices?: null;
  pattern: string;
  mode: number;
}

export type TableSelection =
  | ColumnsSelection
  | RangesSelection
  | ValuesSelection
  | QualitySelection
  | PatternsSelection
  | null;

export type ContextCallbackOr<T> =
  | T
  | ((context: { selection: TableSelection; appSettings: AppSettings }) => T);

export interface OperationCreatorBase {
  name: string;
  title?: PayloadCallbackOr<string>;
  content?: (...args: any) => string;
  codeExport?: (...args: any) => string;
  handleError?: (
    error: Error | string,
    payload: OperationPayload<PayloadWithOptions>
  ) => PromiseOr<Error | string>;
  alias?: string;
  description?: string;
  fields?: (Field | SpecialField | FieldGroup)[];
  defaultOptions?: Partial<OperationOptions>;
  shortcut?: string;
  disabled?: ContextCallbackOr<boolean | string>;
  hidden?: ContextCallbackOr<boolean>;
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
  words: string[];
  key: string;
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
    typeof value.defaultOptions.targetType === 'string';
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
  fieldMessages?: Record<string, string>;
  status: 'not validated' | 'ok' | 'error' | 'fatal error';
};

export type ColumnDetailState = {
  columns: string[];
};

export type State = Operation | ColumnDetailState | 'operations';

export interface OperationActions {
  submitOperation: (
    operation?: Operation | string | null,
    payload?: Partial<PayloadWithOptions> | null,
    changeTab?: boolean
  ) => Promise<void>;
  cancelOperation: (restoreInactive: boolean) => void;
  selectOperation: (
    operation: Operation | string | null,
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

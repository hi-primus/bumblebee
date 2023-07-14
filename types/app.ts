import { FileResponse, StorageErrorPayload } from '@nhost/hasura-storage-js';

import { Client } from './blurr';
import { DataframeObject } from './dataframe';
import { OperationItem, OperationPayload } from './operations';

// interface

export interface Tab {
  label?: string;
  editable?: boolean;
}

// workspace

export type CommandData = {
  operationKey: string;
  payload: OperationPayload;
};

export type TabData = Omit<DataframeObject, 'df' | 'updates'> & {
  dfName: string;
  selected: boolean;
  nameIsPersisted: boolean;
};

export type WorkspaceData = { commands: CommandData[]; tabs: TabData[] };

// fields

export type FileWithId = File & { id: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SelectOption<T = any> {
  text: string;
  value: T;
  disabled?: boolean;
  hidden?: boolean;
}

// table

export interface Chunk {
  start: number;
  stop: number;
  data: object[];
}

// toasts

export type Toast = {
  title: string;
  message?: string;
  type?: 'error' | 'success' | 'info' | 'warning';
  icon?: string;
  class?: string;
  closable?: boolean;
  action?: string;
  actionCallback?: (e: Event) => void;
  time?: number;
  id?: number;
};

export type ToastInput = Prettify<
  Omit<Toast, 'message'> & {
    message?: ArrayOr<string>;
    error?: unknown;
  }
>;

// confirm popup

export type ComponentInfo = {
  name: string;
  component: string | Component;
  content?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export type ConfirmPopup = {
  id: number;
  message: string;
  title?: string;
  acceptLabel?: string;
  cancelLabel?: string;
  accept: (e: Event) => void;
  cancel: () => void;
  fields?: ComponentInfo[];
};

// app

export interface AppSettings {
  openAiApiKey: string;
  workspaceMode: boolean;
  mlServiceUrl: string;
}

export interface AppStatusError {
  message: string;
}

export type AppStatus = 'loading' | 'busy' | 'ready' | 'error' | AppStatusError;

export type UploadFileResponse =
  | {
      error: string | Error;
      filepath: null;
      fileMetadata: null;
    }
  | {
      error: null;
      fileMetadata: FileResponse;
      filepath: string;
    };

export interface Session {
  workspace: {
    id: string;
    name?: string;
  };
  project: {
    id: string;
    name?: string;
  };
}

export type AppProperties = {
  blurr: Client;
  settings: AppSettings;
  session?: Session;
  addToast: (toast: ToastInput) => number;
  getOperations: (dfName?: string, includeLoad?: boolean) => OperationItem[];
  getOperationsCode: (
    dfName?: string,
    includeLoad?: boolean,
    replaceDfName?: string
  ) => Promise<string>;
  get: <T = unknown>(url: string) => Promise<T>;
  post: <T = unknown>(
    url: string,
    data?: Record<string, unknown>
  ) => Promise<T>;
  uploadFile: (
    file: ArrayBuffer | File | FileWithId,
    fileName?: string
  ) => PromiseOr<UploadFileResponse>;
  saveMacroFromSelectedCells: () => unknown;
  selectAndApplyMacro: () => unknown;
};

// mlflow

export type ModelResponse = {
  name: string;
  creation_timestamp: number;
  last_updated_timestamp: number;
  tags: {
    name: string;
    [key: string]: string;
  };
  latest_versions: {
    version: string;
    last_updated_timestamp: number;
    tags: {
      [key: string]: string;
    };
  }[];
};

// macros

type MacroSource = {
  name: string;
  cols: string[];
};

export type Macro = {
  id: string;
  name: string;
  created_at: number;
  operations: CommandData[];
  sources: MacroSource[];
  newSources: MacroSource[];
};

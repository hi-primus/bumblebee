import { FileResponse, StorageErrorPayload } from '@nhost/hasura-storage-js';

import { Client } from './blurr';
import { DataframeObject } from './dataframe';
import { OperationPayload } from './operations';

// interface

export interface Tab {
  label?: string;
}

// workspace

export type CommandData = {
  operationKey: string;
  payload: OperationPayload;
};

export type TabData = Omit<DataframeObject, 'df' | 'updates'> & {
  dfName: string;
  selected: boolean;
};

export type WorkspaceData = { commands: CommandData[]; tabs: TabData[] };

// fields

export type FileWithId = File & { id: string };

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

export type ConfirmPopup = {
  id: number;
  message: string;
  title?: string;
  acceptLabel?: string;
  cancelLabel?: string;
  accept: () => void;
  cancel: () => void;
};

// app

export interface AppSettings {
  openAiApiKey: string;
  workspaceMode: boolean;
}

export interface AppStatusError {
  message: string;
}

export type AppStatus = 'loading' | 'busy' | 'ready' | 'error' | AppStatusError;

type UploadFileResponse =
  | {
      error: StorageErrorPayload;
      filepath: null;
      fileMetadata: null;
    }
  | {
      error: null;
      fileMetadata: FileResponse;
      filepath: string;
    };

export type AppProperties = {
  blurr: Client;
  settings: AppSettings;
  addToast: (toast: ToastInput) => number;
  uploadFile: (file: File | FileWithId) => PromiseOr<UploadFileResponse>;
};

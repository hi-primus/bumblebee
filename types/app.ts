// interface

export interface Tab {
  label?: string;
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

// app

export interface AppStatusError {
  message: string;
}

export type AppStatus = 'loading' | 'busy' | 'ready' | 'error' | AppStatusError;

export type AppFunctions = {
  addToast: (toast: ToastInput) => number;
};

export interface Tab {
  label?: string;
}

export interface AppStatusError {
  message: string;
}

export type AppStatus = 'loading' | 'busy' | 'ready' | 'error' | AppStatusError;

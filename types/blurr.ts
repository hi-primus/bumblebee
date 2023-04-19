import { Blurr as BlurrClient, Source as BlurrSource } from '@hi-primus/blurr';
export { TidyValue } from '@hi-primus/blurr/build/main/utils';

export type Client = ReturnType<typeof BlurrClient>;
export type Source = ReturnType<typeof BlurrSource>;

export interface RequestOptions {
  priority: number;
  getCode?: boolean;
}

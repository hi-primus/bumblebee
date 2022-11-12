import { operations as dataframeOperations } from '../lib/client/operations/dataframe';

import { RunsCode } from './server';

// get keys of a const for a type
type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type SourceFunctions = {
  [K in keyof typeof dataframeOperations]: OmitFirstArgOnIntersection<
    PropType<typeof dataframeOperations[K], 'run'>
  >;
};

export interface Source extends SourceFunctions {
  name: string;
  client: RunsCode;
  _blurrMember: 'source';
  toString: () => string;
}

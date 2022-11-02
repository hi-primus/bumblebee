import { operations as dataframeOperations } from '../lib/client/operations/dataframe';

import { RunsCode } from './server';

export type SourceFunctions = {
  [key in keyof typeof dataframeOperations]: OmitFirstArg<
    PropType<typeof dataframeOperations[key], 'run'>
  >;
};
export interface Source extends SourceFunctions {
  name: string;
  client: RunsCode;
  _blurrMember: 'source';
  toString: () => string;
}

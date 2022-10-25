import { operations as dataframeOperations } from '../lib/client/operations/dataframe';

declare global {
  type SourceFunctions = {
    [key in keyof typeof dataframeOperations]: OmitFirstArg<
      PropType<typeof dataframeOperations[key], 'run'>
    >;
  };
  interface Source extends SourceFunctions {
    name: string;
    client: RunsCode;
    _blurrMember: 'source';
    toString: () => string;
  }
}

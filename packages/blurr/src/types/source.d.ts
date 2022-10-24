import { operations as dataframeOperations } from '../lib/client/operations/dataframe';

declare global {
  type DataframeFunctions = Partial<
    Record<keyof typeof dataframeOperations, OperationFunction>
  >;
  interface Source extends DataframeFunctions {
    name: string;
    client: Client;
    _blurrMember: 'source';
    toString: () => string;
  }
}

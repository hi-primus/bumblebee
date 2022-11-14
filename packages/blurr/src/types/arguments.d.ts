export type NoArgs = Record<string, OperationCompatible>;
export type Cols = string | string[] | number | number[] | undefined;
export type CallbackFunction = (v: PythonCompatible) => PythonCompatible;

export interface Source {
  name: string;
  _blurrMember: 'source';
  toString: () => string;
}

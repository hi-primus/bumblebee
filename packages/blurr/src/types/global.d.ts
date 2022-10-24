type BasicPythonCompatible = number | string | boolean | null;
type PythonCompatible =
  | BasicPythonCompatible
  | R<PythonCompatible>
  | Array<PythonCompatible>;

type BasicOperationCompatible = BasicPythonCompatible | Source;

type OperationCompatible =
  | BasicOperationCompatible
  | R<OperationCompatible>
  | Array<OperationCompatible>;

interface R<T> {
  [key: number | string]: T;
}

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any
  ? A
  : never;

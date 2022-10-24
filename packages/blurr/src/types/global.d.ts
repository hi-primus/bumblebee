type BasicPythonCompatible = number | string | boolean | null;
type PythonCompatible =
  | BasicPythonCompatible
  | Record<number | string, BasicPythonCompatible>
  | Array<BasicPythonCompatible>;

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any
  ? A
  : never;

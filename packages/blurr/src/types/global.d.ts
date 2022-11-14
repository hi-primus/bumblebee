import { CallbackFunction, Source } from './arguments';

export {};

declare global {
  type BasicPythonCompatible = number | string | boolean | null;
  type PythonCompatible =
    | BasicPythonCompatible
    | R<PythonCompatible>
    | Array<PythonCompatible>;

  type BasicOperationCompatible =
    | BasicPythonCompatible
    | ArrayBuffer
    | CallbackFunction
    | Source;

  type OperationCompatible =
    | BasicOperationCompatible
    | R<OperationCompatible>
    | Array<OperationCompatible>;

  type InputArgs = Record<string, OperationCompatible> | OperationCompatible[];

  interface R<T> {
    [key: number | string]: T;
  }

  type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

  type OperationArgs<T> = Record<string, T>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  type ArgumentTypes<F extends Function> = F extends (
    ...args: infer A
  ) => unknown
    ? A
    : never;

  type OmitFirstArg<F> = F extends (x: unknown, ...args: infer P) => infer R
    ? (...args: P) => R
    : never;

  type OmitFirstArgOnIntersection<T> = T extends infer U1 | infer U2
    ? OmitFirstArg<U1> | OmitFirstArg<U2>
    : never;

  type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
    T,
    Exclude<keyof T, Keys>
  > &
    {
      [K in Keys]-?: Required<Pick<T, K>> &
        Partial<Record<Exclude<Keys, K>, undefined>>;
    }[Keys];
}

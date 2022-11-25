import { CallbackFunction, Name, SourceArg } from './arguments';
import { Operation, RunArgs } from './operation';
import { FutureSource, Source } from './source';

export {};

declare global {
  type BasicPythonCompatible =
    | number
    | string
    | boolean
    | null
    | undefined
    | Name;

  type PythonCompatible =
    | BasicPythonCompatible
    | R<PythonCompatible>
    | Array<PythonCompatible>;

  type BasicOperationCompatible =
    | BasicPythonCompatible
    | ArrayBuffer
    | CallbackFunction
    | SourceArg;

  type OperationCompatible =
    | BasicOperationCompatible
    | R<OperationCompatible>
    | Array<OperationCompatible>;

  type OperationType = 'client' | 'dataframe' | 'cols' | 'rows';

  type Kwargs = Record<string, PythonCompatible>;

  type Params = Record<string, OperationCompatible> & {
    operationKey: string;
    operationType: OperationType;
  };

  type InputArgs = Record<string, OperationCompatible> | OperationCompatible[];

  interface R<T> {
    [key: number | string]: T;
  }

  type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

  type OperationArgs<T> = Record<string, T>;

  type AdaptOperation<T extends Operation> = T extends Operation<
    infer TA,
    infer TR
  >
    ? TR extends Source
      ? (...args: RunArgs<TA>) => FutureSource
      : (...args: RunArgs<TA>) => Promise<TR>
    : never;

  type ArrayOrSingle<T> = T | Array<T>;

  type PromiseOr<T> = T | Promise<T>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  type ArgumentTypes<F extends Function> = F extends (
    ...args: infer A
  ) => unknown
    ? A
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

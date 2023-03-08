import { FunctionArgument, Name, RequestOptions, SourceArg } from './arguments';

export {};

declare global {
  type BasicPythonCompatible =
    | number
    | string
    | boolean
    | null
    | undefined
    | Name
    | ArrayBuffer
    | FunctionArgument;

  type PythonCompatible =
    | BasicPythonCompatible
    | R<PythonCompatible>
    | Array<PythonCompatible>;

  type FunctionString = {
    value: string;
    _blurrType: 'function';
  };

  type PythonDictionary = Record<string, PythonCompatible>;

  type BasicOperationCompatible = BasicPythonCompatible | SourceArg;

  type OperationCompatible =
    | BasicOperationCompatible
    | R<OperationCompatible>
    | Array<OperationCompatible>;

  type OperationType = 'client' | 'dataframe' | 'cols' | 'rows';

  type Kwargs = Record<string, PythonCompatible>;

  type Params = Record<string, OperationCompatible> & {
    operationKey: string;
    operationType: OperationType;
    requestOptions?: RequestOptions;
  };

  type InputArgs = Record<string, OperationCompatible> | OperationCompatible[];

  interface R<T> {
    [key: number | string]: T;
  }

  type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

  type OperationArgs<T> = Record<string, T>;

  type ArrayOrSingle<T> = T | Array<T>;

  type PromiseOr<T> = T | Promise<T>;

  type AwaitedOr<T> = T extends PromiseOr<infer U> ? Awaited<U> : Awaited<T>;

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

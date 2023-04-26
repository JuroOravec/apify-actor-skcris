import type { MaybePromise } from '../utils/types';

/** @param {number} ms Number of ms to wait */
export const wait = (ms?: number) => new Promise((res) => setTimeout(res, ms));

interface RetryAsyncOptions {
  /** Number of retries after the function call fails */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  delay?: number;
  /** Callback called with error if the function call errors */
  onError?: (error: unknown, retryIndex: number) => MaybePromise<void>;
}

/** Call async function, and retry to call it `maxRetries` times if it fails. */
export const retryAsync = async <T>(
  fn: (retries: number) => Promise<T>,
  { maxRetries = 1, delay = 0, onError = () => {} }: RetryAsyncOptions = {}
) => {
  if (typeof maxRetries !== 'number' || maxRetries < 0) {
    throw Error(
      `Invalid input for maxRetries in retryAsync(fn, maxRetries). maxRetries must be a non-negative number. Got ${maxRetries}`
    );
  }

  let result: T | null = null;
  const errors: unknown[] = [];
  let retries = 0;
  while (retries <= maxRetries) {
    try {
      result = await fn(retries);
    } catch (err) {
      errors.push(err);
      await onError(err, retries);
      await wait(delay);
      retries++;
      continue; // Retry if failed
    }
    break; // Exit loop and continue flow if success
  }
  return {
    result,
    errors,
  };
};

export const serialAsyncMap = async <T, R>(
  inputArr: T[],
  fn: (item: T, index: number) => MaybePromise<R>
) => {
  const results = await inputArr.reduce(async (aggResultPromise, input, index) => {
    const agg = await aggResultPromise;
    const result = await fn(input, index);
    agg.push(result);
    return agg;
  }, Promise.resolve([] as R[]));

  return results;
};

/** Promise that can be resolved or rejected from outside via functions */
export const deferredPromise = <TVal>() => {
  let resolve: (val: TVal) => void;
  let reject: (reason?: unknown) => void;

  const promise = new Promise<TVal>((res, rej) => {
    resolve = (val: TVal) => res(val);
    reject = (reason?: unknown) => rej(reason);
  });
  return { resolve: resolve!, reject: reject!, promise };
};

export const awaitValues = async <T extends Record<string, Promise<any>>>(obj: T) => {
  const resolvedObj = await Object.entries(obj).reduce<
    Promise<{ [Key in keyof T]: T[Key] extends Promise<infer U> ? U : never }>
  >(async (aggPromise, [key, promise]) => {
    const agg = await aggPromise;
    agg[key as keyof T] = await promise;
    return agg;
  }, Promise.resolve({} as any));

  return resolvedObj;
};

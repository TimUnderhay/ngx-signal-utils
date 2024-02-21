import {
  CreateEffectOptions,
  InputSignal,
  Signal,
  WritableSignal,
  effect,
  untracked
} from "@angular/core";
import { isArray } from './utils';
import {
  SimpleChangeGeneric,
  simpleChangeSignalGeneric,
  simpleChangeSignal
} from './simpleChange';

type MapSources<T, Immediate> = {
  [K in keyof T]: T[K] extends WatchSource<infer V>
    ? Immediate extends true
      ? V | undefined
      : V
    : T[K] extends object
      ? Immediate extends true
        ? T[K] | undefined
        : T[K]
      : never
}

export type WatchSource<T = any> = Signal<T> | InputSignal<T> | WritableSignal<T>;

export type WatchCallback<V = any, OV = any> = (
  value: V,
  oldValue: OV, // if V is array, oldValue could be array of type T but where every element is possibly undefined.  I don't know how to express this as a type.
  onCleanup: OnCleanup,
) => void

type OnCleanup = (cleanupFn: () => void) => void

export type WatchOptions<Immediate = boolean> = {
  immediate?: Immediate
  once?: boolean
  wrapCallback?: boolean
} & CreateEffectOptions;

type MultiWatchSources = (WatchSource<unknown> | object)[]

export type WatchStopHandle = () => void;

// overload: single source + cb
export function watch<T, Immediate extends Readonly<boolean> = false>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchOptions<Immediate>,
): WatchStopHandle;

// overload: array of multiple sources + cb
export function watch<
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false,
>(
  sources: [...T],
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>,
): WatchStopHandle

// overload: multiple sources w/ `as const`
// watch([foo, bar] as const, () => {})
// somehow [...T] breaks when the type is readonly
export function watch<
  T extends Readonly<MultiWatchSources>,
  Immediate extends Readonly<boolean> = false,
>(
  source: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchOptions<Immediate>,
): WatchStopHandle

// implementation
export function watch<T, Immediate extends Readonly<boolean> = true>(
  source: WatchSource<T> | WatchSource<T>[],
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  {
    immediate = true as Immediate,
    once = false,
    wrapCallback = false,
    ...effectOptions
  }: WatchOptions<Immediate> = {},
): WatchStopHandle {
  const sourceIsArray = isArray(source);
  const sources = sourceIsArray
    ? source
    : [source];
  const sourceChanges = sources.map(
    (source) => simpleChangeSignal(source)
  );
  let first = true;
  let cleanupCallback: () => void | undefined;
  const registerCleanupCbFunction = (cleanupCb: () => void) => {
    cleanupCallback = cleanupCb;
  };
  const e = effect(
    () => {
      const changes = sourceChanges.map(
        (sourceChange) => sourceChange()
      );
      const currentValues = changes.map(
        ({ currentValue }) => currentValue
      );
      const previousValues = changes.map(
        ({ previousValue }) => previousValue
      );
      let run = false;
      switch (true) {
        case (!immediate && !first):
        case (once && immediate && first):
        case (once && !immediate && !first):
        case (first && immediate):
        case (immediate && !first):
          run = true;
          break;
      }
      const destroy = once && run;
      first = false;
      if (run) {
        cleanupCallback?.();
        const cbf = () => 
          untracked(
            () => cb(
              !sourceIsArray
                ? currentValues[0]
                : currentValues,
              !sourceIsArray
                ? previousValues[0]
                : previousValues,
              registerCleanupCbFunction
            )
          );
        if (wrapCallback) {
          setTimeout(
            () => cbf()
          );
        }
        else {
          cbf();
        }
      }
      if (destroy) {
        e.destroy();
      }
    },
    effectOptions
  );
  return () => {
    e.destroy();
  };
}


// overload: single source + cb
export function watchChanges<T, Immediate extends Readonly<boolean> = false>(
  source: WatchSource<T>,
  cb: WatchChangesCallback<SimpleChangeGeneric<T>>,
  options?: WatchOptions<Immediate>,
): WatchStopHandle;

// overload: array of multiple sources + cb
export function watchChanges<
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false,
>(
  sources: [...T],
  cb: WatchChangesCallback<MapSourcesSimpleChanges<T, false>>,
  options?: WatchOptions<Immediate>,
): WatchStopHandle

// overload: multiple sources w/ `as const`
// watch([foo, bar] as const, () => {})
// somehow [...T] breaks when the type is readonly
export function watchChanges<
  T extends Readonly<MultiWatchSources>,
  Immediate extends Readonly<boolean> = false,
>(
  source: T,
  cb: WatchChangesCallback<MapSourcesSimpleChanges<T, false>>,
  options?: WatchOptions<Immediate>,
): WatchStopHandle

// implementation
export function watchChanges<T, Immediate extends Readonly<boolean> = true>(
  source: WatchSource<T> | WatchSource<T>[],
  cb: WatchChangesCallback<T>,
  {
    immediate = true as Immediate,
    once = false,
    wrapCallback = false,
    ...effectOptions
  }: WatchOptions<Immediate> = {},
): WatchStopHandle {
  const sourceIsArray = isArray(source);
  const sources = sourceIsArray
    ? source
    : [source];
  const sourceChanges = sources.map(
    (source) => simpleChangeSignalGeneric(source)
  );
  let first = true;
  let cleanupCallback: () => void | undefined;
  const registerCleanupCbFunction = (cleanupCb: () => void) => {
    cleanupCallback = cleanupCb;
  };
  const e = effect(
    () => {
      const changes = sourceChanges.map(
        (sourceChange) => sourceChange()
      );
      let run = false;
      switch (true) {
        case (!immediate && !first):
        case (once && immediate && first):
        case (once && !immediate && !first):
        case (first && immediate):
        case (immediate && !first):
          run = true;
          break;
      }
      const destroy = once && run;
      first = false;
      if (run) {
        cleanupCallback?.();
        const cbf = () =>
          untracked(
            () => cb(
              !sourceIsArray
                ? changes[0]
                : changes as any,
              registerCleanupCbFunction
            )
          );
        if (wrapCallback) {
          setTimeout(
            () => cbf()
          );
        }
        else {
          cbf();
        }
      }
      if (destroy) {
        e.destroy();
      }
    },
    effectOptions
  );
  return () => {
    e.destroy();
  };
}

export type WatchChangesCallback<V> = (
  value: V,
  onCleanup: OnCleanup,
) => void

type MapSourcesSimpleChanges<T, Immediate> = {
  [K in keyof T]: T[K] extends WatchSource<infer V>
    ? Immediate extends true
      ? SimpleChangeGeneric<V | undefined>
      : SimpleChangeGeneric<V>
    : T[K] extends object
      ? Immediate extends true
        ? SimpleChangeGeneric<T[K] | undefined>
        : SimpleChangeGeneric<T[K]>
      : never
}


/**
 * 
 * @param sources An object of key, signal values.
 * @returns WatchStopHandle - a function to terminate the watcher effect
 */
export function watchDebug(
  sources: Record<string, WatchSource>,
): WatchStopHandle {
  const e = effect(
    () => {
      const changes = Object.fromEntries(
        Object.entries(sources).map(
          ([key, source]) => [key, source()]
        )
      )
      console.log(changes);
    }
  );
  return () => {
    e.destroy();
  };
}
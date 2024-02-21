import { CreateEffectOptions, InputSignal, Signal, WritableSignal } from "@angular/core";
import { SimpleChangeGeneric } from './simpleChange';
type MapSources<T, Immediate> = {
    [K in keyof T]: T[K] extends WatchSource<infer V> ? Immediate extends true ? V | undefined : V : T[K] extends object ? Immediate extends true ? T[K] | undefined : T[K] : never;
};
export type WatchSource<T = any> = Signal<T> | InputSignal<T> | WritableSignal<T>;
export type WatchCallback<V = any, OV = any> = (value: V, oldValue: OV, // if V is array, oldValue could be array of type T but where every element is possibly undefined.  I don't know how to express this as a type.
onCleanup: OnCleanup) => void;
type OnCleanup = (cleanupFn: () => void) => void;
export type WatchOptions<Immediate = boolean> = {
    immediate?: Immediate;
    once?: boolean;
    wrapCallback?: boolean;
} & CreateEffectOptions;
type MultiWatchSources = (WatchSource<unknown> | object)[];
export type WatchStopHandle = () => void;
export declare function watch<T, Immediate extends Readonly<boolean> = false>(source: WatchSource<T>, cb: WatchCallback<T, Immediate extends true ? T | undefined : T>, options?: WatchOptions<Immediate>): WatchStopHandle;
export declare function watch<T extends MultiWatchSources, Immediate extends Readonly<boolean> = false>(sources: [...T], cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>, options?: WatchOptions<Immediate>): WatchStopHandle;
export declare function watch<T extends Readonly<MultiWatchSources>, Immediate extends Readonly<boolean> = false>(source: T, cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>, options?: WatchOptions<Immediate>): WatchStopHandle;
export declare function watchChanges<T, Immediate extends Readonly<boolean> = false>(source: WatchSource<T>, cb: WatchChangesCallback<SimpleChangeGeneric<T>>, options?: WatchOptions<Immediate>): WatchStopHandle;
export declare function watchChanges<T extends MultiWatchSources, Immediate extends Readonly<boolean> = false>(sources: [...T], cb: WatchChangesCallback<MapSourcesSimpleChanges<T, false>>, options?: WatchOptions<Immediate>): WatchStopHandle;
export declare function watchChanges<T extends Readonly<MultiWatchSources>, Immediate extends Readonly<boolean> = false>(source: T, cb: WatchChangesCallback<MapSourcesSimpleChanges<T, false>>, options?: WatchOptions<Immediate>): WatchStopHandle;
export type WatchChangesCallback<V> = (value: V, onCleanup: OnCleanup) => void;
type MapSourcesSimpleChanges<T, Immediate> = {
    [K in keyof T]: T[K] extends WatchSource<infer V> ? Immediate extends true ? SimpleChangeGeneric<V | undefined> : SimpleChangeGeneric<V> : T[K] extends object ? Immediate extends true ? SimpleChangeGeneric<T[K] | undefined> : SimpleChangeGeneric<T[K]> : never;
};
/**
 *
 * @param sources An object of key, signal values.
 * @returns WatchStopHandle - a function to terminate the watcher effect
 */
export declare function watchDebug(sources: Record<string, WatchSource>): WatchStopHandle;
export {};

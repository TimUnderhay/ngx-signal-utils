import { signal, Signal } from '@angular/core';

/**
 * A signal whose value is a `ReadonlyMap`, with in-place mutation methods that
 * trigger reactivity via an internal version counter.
 *
 * Behaves as a standard signal — call it to read the current map:
 *
 *   const m = mapSignal<string, number>();
 *   const size = computed(() => m().size);
 *   const value = computed(() => m().get('key'));
 *
 * Use `mutate()` for batched or arbitrary mutations:
 *
 *   m.mutate(map => {
 *     map.set('a', 1);
 *     map.set('b', 2);
 *   });
 *
 * Convenience methods `set`, `delete`, and `clear` are provided for common
 * single-operation mutations.
 *
 * Unlike `signal(new Map())`, mutations are O(1) — the inner Map is never copied.
 * The tradeoff is that all reactive consumers re-run on any change, regardless
 * of which key was modified.
 */
export type MapSignal<K, V> = Signal<ReadonlyMap<K, V>> & {
  /** Mutate the inner Map in place. The version is bumped after the callback runs,
   * regardless of whether anything actually changed. Do not retain a reference to
   * the passed Map outside the callback, and do not replace it. */
  mutate(mutator: (map: Map<K, V>) => void): void;

  /** Set a single key. Equivalent to `mutate(m => m.set(k, v))`. */
  set(key: K, value: V): void;

  /** Delete a single key. Returns whether the key was present. */
  delete(key: K): boolean;

  /** Clear all entries. */
  clear(): void;
};

export function mapSignal<K, V>(initial?: Iterable<readonly [K, V]>): MapSignal<K, V> {
  const inner = new Map<K, V>(initial);
  const version = signal(0);
  const bump = () => version.update(v => v + 1);

  // The signal itself: calling it reads the version (registering the dependency)
  // and returns the inner map as ReadonlyMap.
  const read = (() => {
    version();
    return inner as ReadonlyMap<K, V>;
  }) as MapSignal<K, V>;

  // Preserve the Signal brand by copying symbol-keyed properties from a real
  // signal. This lets Angular's reactivity machinery recognize this as a signal.
  const protoSignal = signal<ReadonlyMap<K, V>>(inner);
  for (const sym of Object.getOwnPropertySymbols(protoSignal)) {
    (read as any)[sym] = (protoSignal as any)[sym];
  }

  read.mutate = (mutator) => {
    mutator(inner);
    bump();
  };
  read.set = (key, value) => {
    inner.set(key, value);
    bump();
  };
  read.delete = (key) => {
    const result = inner.delete(key);
    bump();
    return result;
  };
  read.clear = () => {
    inner.clear();
    bump();
  };

  return read;
}
import { signal, Signal } from '@angular/core';

/**
 * A signal whose value is a `ReadonlySet`, with in-place mutation methods that
 * trigger reactivity via an internal version counter.
 *
 * Behaves as a standard signal — call it to read the current set:
 *
 *   const s = setSignal<number>();
 *   const size = computed(() => s().size);
 *   const hasFive = computed(() => s().has(5));
 *
 * Use `mutate()` for batched or arbitrary mutations:
 *
 *   s.mutate(set => {
 *     for (const x of incoming) set.add(x);
 *   });
 *
 * Convenience methods `add`, `delete`, and `clear` are provided for common
 * single-operation mutations.
 *
 * Unlike `signal(new Set())`, mutations are O(1) — the inner Set is never copied.
 * The tradeoff is that all reactive consumers re-run on any change, regardless
 * of which value was modified.
 */
export type SetSignal<T> = Signal<ReadonlySet<T>> & {
  /** Mutate the inner Set in place. The version is bumped after the callback runs,
   * regardless of whether anything actually changed. Do not retain a reference to
   * the passed Set outside the callback, and do not replace it. */
  mutate(mutator: (set: Set<T>) => void): void;

  /** Add a single value. Equivalent to `mutate(s => s.add(v))`. */
  add(value: T): void;

  /** Delete a single value. Returns whether the value was present. */
  delete(value: T): boolean;

  /** Clear all values. */
  clear(): void;
};

export function setSignal<T>(initial?: Iterable<T>): SetSignal<T> {
  const inner = new Set<T>(initial);
  const version = signal(0);
  const bump = () => version.update(v => v + 1);

  const read = (() => {
    version();
    return inner as ReadonlySet<T>;
  }) as SetSignal<T>;

  // Preserve the Signal brand by copying symbol-keyed properties from a real signal.
  const protoSignal = signal<ReadonlySet<T>>(inner);
  for (const sym of Object.getOwnPropertySymbols(protoSignal)) {
    (read as any)[sym] = (protoSignal as any)[sym];
  }

  read.mutate = (mutator) => {
    mutator(inner);
    bump();
  };
  read.add = (value) => {
    inner.add(value);
    bump();
  };
  read.delete = (value) => {
    const result = inner.delete(value);
    bump();
    return result;
  };
  read.clear = () => {
    inner.clear();
    bump();
  };

  return read;
}
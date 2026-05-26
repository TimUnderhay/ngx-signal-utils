# ngx-signal-utils
Helper functions for working with Angular Signals in a cleaner way.

Provides several helper functions:

* An Angular equivalent of Vue's `watch()` function.  Some might consider `watch()` cleaner and less bug-prone than Angular's `effect()`, and thus produces more maintainable code.

* `watchChanges()` is similar to `watch()` but rather than passing the current value of a tracked signal, it passes a generically-typed `SimpleChange<T>` object containing both the current and previous values.

* `watchDebug()` writes Signal value changes to the console.

* `simpleChangeSignal()` wraps a signal to produce a `SimpleChange<T>`-typed signal, providing the current and previous values of the tracked signal.

* `mutate()` provides a cleaner way to update a property of a signal-wrapped object without verbose spread syntax.

* `mutateArray()` similar to `mutate()` but for signal-wrapped arrays.

* `mapSignal()` provides a signal wrapping a `Map` with O(1) in-place mutation, avoiding the copy-on-write cost of `signal(new Map())`.

* `setSignal()` provides a signal wrapping a `Set` with the same in-place mutation semantics as `mapSignal()`.

## `watch()`

`watch()` implementation is similar to Vue's at https://vuejs.org/api/reactivity-core.html#watch, with the options parameter differing.  

```typescript
// watching single source
function watch<T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
): WatchStopHandle

// watching multiple sources
function watch<T>(
  sources: WatchSource<T>[],
  callback: WatchCallback<T[]>,
  options?: WatchOptions
): WatchStopHandle

type WatchCallback<T> = (
  value: T,
  oldValue: T,
  onCleanup: (cleanupFn: () => void) => void
) => void

type WatchSource<T = any> = Signal<T> | InputSignal<T> | WritableSignal<T>;

type WatchOptions = {
  immediate?: boolean
  once?: boolean
  wrapCallback?: boolean
} & CreateEffectOptions;
```

### WatchOptions:
| Option | Type | Default Value | Description |
| -----  | ---- | ------------- | ----------- |
| immediate | boolean | true | Run the callback immediately when watcher created |
| once | boolean | false | Run the callback only once.  Watcher is destroyed after it runs. |
| wrapCallback | boolean | false | Wraps the callback in a setTimeout() with 0ms delay, deferring execution until after the current change detection cycle. Useful as a pragmatic fix for ExpressionChangedAfterItHasBeenCheckedError in cases where restructuring the data flow is not practical. Use sparingly. |
| injector | boolean \| undefined | undefined | See https://angular.dev/api/core/CreateEffectOptions |
| manualCleanup | boolean \| undefined | undefined | See https://angular.dev/api/core/CreateEffectOptions |
| allowSignalWrites | boolean \| undefined | undefined | See https://angular.dev/api/core/CreateEffectOptions |

### Why use `watch()` over `effect()`?

- Common bugs are negated, whereby `effect()` callbacks don't trigger because signal getter invocations are inside skipped code blocks.  The `watch()` callback should always run when you expect it to.

- Watched values are declared explicitly in the watch source(s), and their unwrapped values are passed as a value / value array to the callback.  This means it usually isn't necessary to invoke signal getters in the watch callback.  It also negates the need, as some do with `effect()`, to run signal getters in the first lines of the `effect()` callback as a kind of 'declaration', which looks strange and not in keeping with common JS / TS practices.  This arguably leads to cleaner, more maintainable code.

## `watchChanges()`

```typescript
// watching single source
function watchChanges<T>(
  source: WatchSource<T>,
  callback: WatchChangesCallback<SimpleChange<T>>,
  options?: WatchOptions
): WatchStopHandle

// watching multiple sources
function watchChanges<T>(
  sources: WatchSource<T>[],
  callback: WatchChangesCallback<MapSourcesSimpleChanges<T, false>>, // callback param is array of typed SimpleChange objects, where value / previousValue are unwrapped signal values
  options?: WatchOptions
): WatchStopHandle

type WatchCallback<T> = (
  value: T,
  oldValue: T,
  onCleanup: (cleanupFn: () => void) => void
) => void
```

Similar to `watch()` but rather than passing the current value of a tracked signal to the watcher callback, it passes `SimpleChange<T>`.  Just like the `SimpleChanges` parameter to `ngOnChanges()`, it provides the current and previous unwrapped value of the tracked signal.  

### Why use `watchChanges()`?
One can, in many or even most cases, replace monolithic `ngOnChanges()` with more streamlined and cleaner reactive code.  This means you don't have to handle all of your input change side-effects from that single lifecycle hook.

### Note
Should you invoke a signal getter (i.e. `this.mySignal()`) inside a watcher callback, it will not cause the signal to be watched / callback to trigger.  This is because the watcher code wraps the callback in `untracked()`.

## `watchDebug()`

Accepts a sources object of key, signal values.  Writes any value changes to the console.  Useful for debugging.

```typescript
function watchDebug(sources: Record<string, WatchSource>): WatchStopHandle
```

### watchDebug() Example

```typescript
const count = signal(0);
const name = signal('Alice');

const stop = watchDebug({ count, name });
// logs { count: 0, name: 'Alice' } immediately, then on any change

stop(); // stop watching
```

## `simpleChangeSignal()`

Wraps a signal to produce a `SimpleChange<T>`-typed signal, providing both the current and previous values of the tracked signal, along with a `firstChange` flag.  Useful when you need to know what a signal's value was before it changed.

```typescript
function simpleChangeSignal<T>(signal: Signal<T>): Signal<SimpleChange<T>>
```

### Example

```typescript
const count = signal(0);
const countChange = simpleChangeSignal(count);

effect(() => {
  const change = countChange();
  console.log(change.previousValue); // value before change
  console.log(change.currentValue);  // current value
  console.log(change.firstChange);   // true on first emission
  console.log(change.isFirstChange()); // equivalent to above
});

count.set(1); // logs: 0, 1, false
```

### Why use `simpleChangeSignal()`?

Angular signals have no built-in concept of previous value — you only ever get the current value.  `simpleChangeSignal()` bridges that gap, using the same familiar `SimpleChange` shape used by Angular's `ngOnChanges()` lifecycle hook.

Note that `watchChanges()` uses `simpleChangeSignal()` internally, so if you find yourself reaching for `simpleChangeSignal()` directly inside a watcher, `watchChanges()` is likely the cleaner choice.


## `mutate()`

Provides a cleaner way to update a property of a signal-wrapped object without needing to manually spread the object to trigger change detection.

```typescript
function mutate<T extends object>(sig: WritableSignal<T>, fn: (value: T) => void): void
```

### Example

```typescript
// Without mutate()
user.update(u => ({ ...u, address: { ...u.address, street: newStreet } }));

// With mutate()
mutate(user, u => { u.address.street = newStreet; });
```

## `mutateArray()`

Similar to `mutate()` but for signal-wrapped arrays.

```typescript
function mutateArray<T>(sig: WritableSignal<T[]>, fn: (value: T[]) => void): void
```

### Example

```typescript
// Without mutateArray()
items.set([...items(), newItem]);

// With mutateArray()
mutateArray(items, arr => arr.push(newItem));
mutateArray(items, arr => arr.splice(index, 1));
mutateArray(items, arr => arr.sort((a, b) => a.name.localeCompare(b.name)));
```

### Why use `mutate()` / `mutateArray()` over `update()`?

- Deeply nested object updates with `update()` require verbose and error-prone spread chains.  `mutate()` allows natural JS mutation syntax inside the callback, with the reference swap handled transparently.
- Array mutations such as `push()`, `splice()`, and `sort()` are expressed naturally and readably, without needing to reconstruct the array manually.

## `mapSignal()`

Creates a signal whose value is a `ReadonlyMap`, with in-place mutation methods that trigger reactivity via an internal version counter.  Behaves as a standard Angular signal — call it to read the current map, and use the `mutate()` / `set()` / `delete()` / `clear()` methods to modify it.

```typescript
function mapSignal<K, V>(initial?: Iterable<readonly [K, V]>): MapSignal<K, V>

type MapSignal<K, V> = Signal<ReadonlyMap<K, V>> & {
  mutate(mutator: (map: Map<K, V>) => void): void;
  set(key: K, value: V): void;
  delete(key: K): boolean;
  clear(): void;
};
```

### Example

```typescript
const cache = mapSignal<string, User>();

// Reads go through the signal call — standard Angular signal protocol
const userCount = computed(() => cache().size);
const alice = computed(() => cache().get('alice'));

// Single-key mutations via convenience methods
cache.set('alice', { name: 'Alice', age: 30 });
cache.set('bob', { name: 'Bob', age: 25 });
cache.delete('bob');
cache.clear();

// Batched or arbitrary mutations via mutate()
cache.mutate(map => {
  for (const user of fetchedUsers) {
    map.set(user.id, user);
  }
});
```

### Why use `mapSignal()` over `signal(new Map())`?

The idiomatic way to make a `Map` reactive in Angular is `signal(new Map())`, with updates performed via copy-on-write: `mapSig.update(m => new Map(m).set(k, v))`.  This is O(n) per mutation, which becomes prohibitive for large collections or hot update loops.

`mapSignal()` wraps a stable inner `Map` and uses a version counter to invalidate downstream consumers.  Mutations are O(1) and do not allocate a new `Map`.  Reads register reactive dependencies as expected, so `computed()` and `effect()` integrate naturally.

### Tradeoff

All reactive consumers re-run on any change to the map, regardless of which key changed.  This is the deliberate tradeoff in exchange for O(1) mutation.  If you need per-key dependency tracking, this is not the right primitive.

### Note on `mutate()` vs `update()`

`MapSignal` deliberately uses `mutate()` rather than `update()` because the operation is fundamentally different from the standard signal `update()`:

- Standard `update<T>(fn: (prev: T) => T)` — replacement: the callback returns the new value, and the signal's value is swapped.
- `MapSignal.mutate(fn: (map: Map<K, V>) => void)` — in-place mutation: the callback modifies the map directly and returns void.  The inner `Map` reference is preserved.

The `mutate()` callback bumps the version regardless of whether the callback actually changed anything.  Do not retain a reference to the passed `Map` outside the callback, and do not replace it.

## `setSignal()`

Creates a signal whose value is a `ReadonlySet`, with the same in-place mutation semantics as `mapSignal()`.

```typescript
function setSignal<T>(initial?: Iterable<T>): SetSignal<T>

type SetSignal<T> = Signal<ReadonlySet<T>> & {
  mutate(mutator: (set: Set<T>) => void): void;
  add(value: T): void;
  delete(value: T): boolean;
  clear(): void;
};
```

### Example

```typescript
const selectedIds = setSignal<string>();

// Reads go through the signal call
const selectionCount = computed(() => selectedIds().size);
const isSelected = (id: string) => computed(() => selectedIds().has(id));

// Single-value mutations
selectedIds.add('item-1');
selectedIds.add('item-2');
selectedIds.delete('item-1');
selectedIds.clear();

// Batched mutations
selectedIds.mutate(set => {
  for (const id of bulkSelection) set.add(id);
});
```

### Why use `setSignal()` over `signal(new Set())`?

Same rationale as `mapSignal()`: copy-on-write (`signal(new Set())` with `s.update(prev => new Set(prev).add(value))`) is O(n) per mutation.  `setSignal()` provides O(1) mutation via in-place modification of a stable inner `Set`.  The same tradeoff applies — all consumers re-run on any change.  As with `mapSignal()`, the in-place mutation method is named `mutate()` rather than `update()` to reflect that it is fundamentally a different operation.
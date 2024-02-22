# ngx-signal-utils
Helper functions for working with Angular Signals in a cleaner way.

Provides several helper functions:

* An Angular equivalent of Vue's `watch()` function.  Some might consider `watch()` cleaner and less bug-prone than Angular's `effect()`, and thus produces more maintainable code.

* `watchChanges()` is similar to `watch()` but rather than passing the current value of a tracked signal, it passes a generically-typed version of `SimpleChange`.

* `watchDebug()` writes Signal value changes to the console.

## `watch()`

`watch()` implementation is similar to Vue's at https://vuejs.org/api/reactivity-core.html#watch, with the options paremeter differing.  

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
| wrapCallback | boolean | false | Wraps the callback in a setTimeout() with 0ms delay |
| injector | boolean \| undefined | undefined | See https://angular.io/api/core/CreateEffectOptions |
| manualCleanup | boolean \| undefined | undefined | See https://angular.io/api/core/CreateEffectOptions |
| allowSignalWrites | boolean \| undefined | undefined | See https://angular.io/api/core/CreateEffectOptions |

### Why use `watch()` over `effect()`?

- Common bugs are negated, whereby `effect()` callbacks don't trigger because signal getter invocations are inside skipped code blocks.  The `watch()` callback should always run when you expect it to.

- Watched values are declared explicitly in the watch source(s), and their unwrapped values are passed as a value / value array to the callback.  This means it usually isn't necessary to invoke signal getters in the watch callback.  It also negates the need, as some do with `effect()`, to run signal getters in the first lines of the `effect()` callback as a kind of 'declaration', which looks strange and not in keeping with common JS / TS practices.  This arguably leads to cleaner, more maintainable code.

## `watchChanges()`

```typescript
// watching single source
function watchChanges<T>(
  source: WatchSource<T>,
  callback: WatchChangesCallback<SimpleChangeGeneric<T>>,
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

Similar to `watch()` but rather than passing the current value of a tracked signal to the watcher callback, it passes a generically-typed version of `SimpleChange`.  Just like the `SimpleChanges` parameter to `ngOnChanges()`, it provides the current and previous unwrapped value of the tracked signal.  

### Why use `watchChanges()`?
One can, in many or even most cases, replace monolithic `ngOnChanges()` with more streamlined and cleaner reactive code.  This means you don't have to handle all of your input change side-effects from that single lifecycle hook.

## `watchDebug()`

Accepts a sources object of key, signal values.  Writes any value changes to the console.  Useful for debugging.

## Additional Info
Should you invoke a signal getter (i.e. `this.mySignal()`) inside a watcher callback, it will not cause the signal to be watched / callback to trigger.  This is because the watcher code wraps the callback in `untracked()`.
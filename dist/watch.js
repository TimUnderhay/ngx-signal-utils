import { effect, untracked } from "@angular/core";
import { isArray } from './utils';
import { simpleChangeSignalGeneric, simpleChangeSignal } from './simpleChange';
// implementation
export function watch(source, cb, { immediate = true, once = false, wrapCallback = false, ...effectOptions } = {}) {
    const sourceIsArray = isArray(source);
    const sources = sourceIsArray
        ? source
        : [source];
    const sourceChanges = sources.map((source) => simpleChangeSignal(source));
    let first = true;
    let cleanupCallback;
    const registerCleanupCbFunction = (cleanupCb) => {
        cleanupCallback = cleanupCb;
    };
    const e = effect(() => {
        const changes = sourceChanges.map((sourceChange) => sourceChange());
        const currentValues = changes.map(({ currentValue }) => currentValue);
        const previousValues = changes.map(({ previousValue }) => previousValue);
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
            const cbf = () => untracked(() => cb(!sourceIsArray
                ? currentValues[0]
                : currentValues, !sourceIsArray
                ? previousValues[0]
                : previousValues, registerCleanupCbFunction));
            if (wrapCallback) {
                setTimeout(() => cbf());
            }
            else {
                cbf();
            }
        }
        if (destroy) {
            e.destroy();
        }
    }, effectOptions);
    return () => {
        e.destroy();
    };
}
// implementation
export function watchChanges(source, cb, { immediate = true, once = false, wrapCallback = false, ...effectOptions } = {}) {
    const sourceIsArray = isArray(source);
    const sources = sourceIsArray
        ? source
        : [source];
    const sourceChanges = sources.map((source) => simpleChangeSignalGeneric(source));
    let first = true;
    let cleanupCallback;
    const registerCleanupCbFunction = (cleanupCb) => {
        cleanupCallback = cleanupCb;
    };
    const e = effect(() => {
        const changes = sourceChanges.map((sourceChange) => sourceChange());
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
            const cbf = () => untracked(() => cb(!sourceIsArray
                ? changes[0]
                : changes, registerCleanupCbFunction));
            if (wrapCallback) {
                setTimeout(() => cbf());
            }
            else {
                cbf();
            }
        }
        if (destroy) {
            e.destroy();
        }
    }, effectOptions);
    return () => {
        e.destroy();
    };
}
/**
 *
 * @param sources An object of key, signal values.
 * @returns WatchStopHandle - a function to terminate the watcher effect
 */
export function watchDebug(sources) {
    const e = effect(() => {
        const changes = Object.fromEntries(Object.entries(sources).map(([key, source]) => [key, source()]));
        console.log(changes);
    });
    return () => {
        e.destroy();
    };
}
//# sourceMappingURL=watch.js.map
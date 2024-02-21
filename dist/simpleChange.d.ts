import { Signal, SimpleChange } from "@angular/core";
export declare class SimpleChangeGeneric<T> {
    previousValue: T;
    currentValue: T;
    firstChange: boolean;
    constructor(previousValue: T, currentValue: T, firstChange: boolean);
    /**
     * Check whether the new value is the first value assigned.
     */
    isFirstChange(): boolean;
}
export declare function simpleChangeSignalGeneric<T>(signal: Signal<T>): Signal<SimpleChangeGeneric<T>>;
export declare function simpleChangeSignal<T>(signal: Signal<T>): Signal<SimpleChange>;

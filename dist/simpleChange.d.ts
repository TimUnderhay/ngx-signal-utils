import { Signal, SimpleChange } from "@angular/core";
export declare function simpleChangeSignal<T>(signal: Signal<T>): Signal<SimpleChange<T>>;

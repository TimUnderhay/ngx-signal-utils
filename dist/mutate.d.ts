import { WritableSignal } from '@angular/core';
export declare function mutate<T extends object>(sig: WritableSignal<T>, fn: (value: T) => void): void;
export declare function mutateArray<T>(sig: WritableSignal<T[]>, fn: (value: T[]) => void): void;

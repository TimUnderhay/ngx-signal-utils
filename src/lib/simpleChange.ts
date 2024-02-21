import {
  Signal,
  SimpleChange
} from "@angular/core";
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, scan } from 'rxjs';


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


export function simpleChangeSignalGeneric<T>(signal: Signal<T>): Signal<SimpleChangeGeneric<T>> {
  const obs$ = toObservable(signal);
  return toSignal(
    obs$.pipe(
      scan(
        (accumulator: T[], value) => {
          accumulator.push(value);
          return accumulator.slice(-2);
        },
        []
      ),
      map(
        (values) => {
          const [currentValue, previousValue] = [...values].reverse(); // must create a new ref as reverse() mutates array in-place, which would otherwise corrupt the accumulator
          return new SimpleChange(previousValue, currentValue, values.length === 1);
        }
      )
    )
  ) as Signal<SimpleChangeGeneric<T>>;
}


export function simpleChangeSignal<T>(signal: Signal<T>): Signal<SimpleChange> {
  const obs$ = toObservable(signal);
  return toSignal(
    obs$.pipe(
      scan(
        (accumulator: T[], value) => {
          accumulator.push(value);
          return accumulator.slice(-2);
        },
        []
      ),
      map(
        (values) => {
          const [currentValue, previousValue] = [...values].reverse(); // must create a new ref as reverse() mutates array in-place, which would otherwise corrupt the accumulator
          return new SimpleChange(previousValue, currentValue, values.length === 1);
        }
      )
    )
  ) as Signal<SimpleChange>;
}

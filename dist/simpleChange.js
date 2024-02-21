import { SimpleChange } from "@angular/core";
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, scan } from 'rxjs';
export function simpleChangeSignalGeneric(signal) {
    const obs$ = toObservable(signal);
    return toSignal(obs$.pipe(scan((accumulator, value) => {
        accumulator.push(value);
        return accumulator.slice(-2);
    }, []), map((values) => {
        const [currentValue, previousValue] = [...values].reverse(); // must create a new ref as reverse() mutates array in-place, which would otherwise corrupt the accumulator
        return new SimpleChange(previousValue, currentValue, values.length === 1);
    })));
}
export function simpleChangeSignal(signal) {
    const obs$ = toObservable(signal);
    return toSignal(obs$.pipe(scan((accumulator, value) => {
        accumulator.push(value);
        return accumulator.slice(-2);
    }, []), map((values) => {
        const [currentValue, previousValue] = [...values].reverse(); // must create a new ref as reverse() mutates array in-place, which would otherwise corrupt the accumulator
        return new SimpleChange(previousValue, currentValue, values.length === 1);
    })));
}
//# sourceMappingURL=simpleChange.js.map
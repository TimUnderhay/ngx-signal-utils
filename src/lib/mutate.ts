import { WritableSignal } from '@angular/core';

export function mutate<T extends object>(sig: WritableSignal<T>, fn: (value: T) => void): void {
  const current = sig();
  fn(current);
  sig.set({ ...current });
}

export function mutateArray<T>(sig: WritableSignal<T[]>, fn: (value: T[]) => void): void {
  const current = sig();
  fn(current);
  sig.set([...current]);
}

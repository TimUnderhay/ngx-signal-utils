import { describe, it, expect } from 'vitest';
import { computed, isSignal } from '@angular/core';
import { mapSignal } from './map-signal.js';
import { setSignal } from './set-signal.js';

describe('mapSignal', () => {
  describe('signal protocol', () => {
    it('is recognized as a signal', () => {
      const m = mapSignal<string, number>();
      expect(isSignal(m)).toBe(true);
    });

    it('returns a ReadonlyMap when called', () => {
      const m = mapSignal<string, number>();
      expect(m()).toBeInstanceOf(Map);
    });

    it('preserves inner map identity across mutations', () => {
      const m = mapSignal<string, number>();
      const ref1 = m();
      m.set('a', 1);
      const ref2 = m();
      expect(ref1).toBe(ref2);
    });
  });

  describe('basic read/write', () => {
    it('starts empty', () => {
      const m = mapSignal<string, number>();
      expect(m().size).toBe(0);
    });

    it('set adds a key-value pair', () => {
      const m = mapSignal<string, number>();
      m.set('a', 1);
      expect(m().get('a')).toBe(1);
    });

    it('has returns true for present key', () => {
      const m = mapSignal<string, number>();
      m.set('a', 1);
      expect(m().has('a')).toBe(true);
    });

    it('has returns false for absent key', () => {
      const m = mapSignal<string, number>();
      expect(m().has('b')).toBe(false);
    });

    it('size reflects content', () => {
      const m = mapSignal<string, number>();
      m.set('a', 1);
      m.set('b', 2);
      expect(m().size).toBe(2);
    });
  });

  describe('initial values', () => {
    it('size reflects initial entries', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      expect(m().size).toBe(2);
    });

    it('initial entries are present', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      expect(m().get('a')).toBe(1);
      expect(m().get('b')).toBe(2);
    });
  });

  describe('delete and clear', () => {
    it('delete returns true for present key', () => {
      const m = mapSignal<string, number>([['a', 1]]);
      expect(m.delete('a')).toBe(true);
    });

    it('delete returns false for absent key', () => {
      const m = mapSignal<string, number>();
      expect(m.delete('nope')).toBe(false);
    });

    it('size decreases after delete', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      m.delete('a');
      expect(m().size).toBe(1);
    });

    it('clear empties the map', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      m.clear();
      expect(m().size).toBe(0);
    });
  });

  describe('iteration', () => {
    it('entries yields all pairs', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      expect([...m().entries()]).toHaveLength(2);
    });

    it('keys yields all keys', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      const keys = [...m().keys()];
      expect(keys).toEqual(expect.arrayContaining(['a', 'b']));
    });

    it('values yields all values', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      const values = [...m().values()];
      expect(values).toEqual(expect.arrayContaining([1, 2]));
    });

    it('Symbol.iterator works for spread', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      expect([...m()]).toHaveLength(2);
    });
  });

  describe('computed reactivity', () => {
    it('reflects size changes', () => {
      const m = mapSignal<string, number>();
      const sizeC = computed(() => m().size);
      expect(sizeC()).toBe(0);
      m.set('a', 10);
      expect(sizeC()).toBe(1);
    });

    it('reflects value changes', () => {
      const m = mapSignal<string, number>();
      const aValC = computed(() => m().get('a'));
      expect(aValC()).toBeUndefined();
      m.set('a', 10);
      expect(aValC()).toBe(10);
      m.set('a', 20);
      expect(aValC()).toBe(20);
    });

    it('reflects deletion', () => {
      const m = mapSignal<string, number>([['a', 1]]);
      const sizeC = computed(() => m().size);
      const aValC = computed(() => m().get('a'));
      m.delete('a');
      expect(sizeC()).toBe(0);
      expect(aValC()).toBeUndefined();
    });

    it('reflects clear', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      const sizeC = computed(() => m().size);
      m.clear();
      expect(sizeC()).toBe(0);
    });
  });

  describe('update mutator', () => {
    it('bulk update reflected in size', () => {
      const m = mapSignal<string, number>();
      m.mutate(map => {
        map.set('a', 1);
        map.set('b', 2);
        map.set('c', 3);
      });
      expect(m().size).toBe(3);
    });

    it('computed sees bulk update', () => {
      const m = mapSignal<string, number>();
      const sizeC = computed(() => m().size);
      m.mutate(map => {
        map.set('a', 1);
        map.set('b', 2);
      });
      expect(sizeC()).toBe(2);
    });

    it('all entries are set', () => {
      const m = mapSignal<string, number>();
      m.mutate(map => {
        map.set('a', 1);
        map.set('b', 2);
      });
      expect(m().get('a')).toBe(1);
      expect(m().get('b')).toBe(2);
    });

    it('mixed operations within update', () => {
      const m = mapSignal<string, number>([['a', 1], ['b', 2]]);
      m.mutate(map => {
        map.set('c', 3);
        map.delete('a');
      });
      expect(m().size).toBe(2);
      expect(m().has('a')).toBe(false);
      expect(m().get('c')).toBe(3);
    });

    it('no-op update still invalidates computed', () => {
      const m = mapSignal<string, number>([['a', 1]]);
      let computeRuns = 0;
      const c = computed(() => {
        computeRuns++;
        return m().size;
      });
      c();
      expect(computeRuns).toBe(1);
      m.mutate(() => { /* no-op */ });
      c();
      expect(computeRuns).toBe(2);
    });
  });

  describe('performance', () => {
    it('1000 mutations on a 10k-entry map complete in <50ms', () => {
      const m = mapSignal<number, number>();
      for (let i = 0; i < 10_000; i++) m.set(i, i);

      const start = performance.now();
      for (let i = 0; i < 1_000; i++) m.set(i, i * 2);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });
});

describe('setSignal', () => {
  describe('signal protocol', () => {
    it('is recognized as a signal', () => {
      const s = setSignal<number>();
      expect(isSignal(s)).toBe(true);
    });

    it('returns a ReadonlySet when called', () => {
      const s = setSignal<number>();
      expect(s()).toBeInstanceOf(Set);
    });

    it('preserves inner set identity across mutations', () => {
      const s = setSignal<number>();
      const ref1 = s();
      s.add(1);
      const ref2 = s();
      expect(ref1).toBe(ref2);
    });
  });

  describe('basic read/write', () => {
    it('starts empty', () => {
      const s = setSignal<number>();
      expect(s().size).toBe(0);
    });

    it('add inserts a value', () => {
      const s = setSignal<number>();
      s.add(1);
      expect(s().has(1)).toBe(true);
    });

    it('has returns false for absent value', () => {
      const s = setSignal<number>();
      expect(s().has(99)).toBe(false);
    });

    it('size reflects content', () => {
      const s = setSignal<number>();
      s.add(1);
      s.add(2);
      expect(s().size).toBe(2);
    });

    it('add is idempotent', () => {
      const s = setSignal<number>();
      s.add(1);
      s.add(1);
      expect(s().size).toBe(1);
    });
  });

  describe('initial values', () => {
    it('size reflects initial entries', () => {
      const s = setSignal<number>([1, 2, 3]);
      expect(s().size).toBe(3);
    });

    it('initial values are present', () => {
      const s = setSignal<number>([1, 2, 3]);
      expect(s().has(1)).toBe(true);
      expect(s().has(2)).toBe(true);
      expect(s().has(3)).toBe(true);
    });
  });

  describe('delete and clear', () => {
    it('delete returns true for present value', () => {
      const s = setSignal<number>([1, 2, 3]);
      expect(s.delete(2)).toBe(true);
    });

    it('delete returns false for absent value', () => {
      const s = setSignal<number>([1, 2, 3]);
      expect(s.delete(99)).toBe(false);
    });

    it('size decreases after delete', () => {
      const s = setSignal<number>([1, 2, 3]);
      s.delete(2);
      expect(s().size).toBe(2);
    });

    it('clear empties the set', () => {
      const s = setSignal<number>([1, 2, 3]);
      s.clear();
      expect(s().size).toBe(0);
    });
  });

  describe('iteration', () => {
    it('Symbol.iterator yields all values', () => {
      const s = setSignal<number>([1, 2, 3]);
      expect([...s()]).toHaveLength(3);
    });

    it('values() yields all', () => {
      const s = setSignal<number>([1, 2, 3]);
      expect([...s().values()]).toHaveLength(3);
    });
  });

  describe('computed reactivity', () => {
    it('reflects size changes', () => {
      const s = setSignal<number>();
      const sizeC = computed(() => s().size);
      expect(sizeC()).toBe(0);
      s.add(5);
      expect(sizeC()).toBe(1);
    });

    it('reflects has changes', () => {
      const s = setSignal<number>();
      const hasFive = computed(() => s().has(5));
      expect(hasFive()).toBe(false);
      s.add(5);
      expect(hasFive()).toBe(true);
      s.delete(5);
      expect(hasFive()).toBe(false);
    });

    it('reflects clear', () => {
      const s = setSignal<number>([1, 2, 3]);
      const sizeC = computed(() => s().size);
      s.clear();
      expect(sizeC()).toBe(0);
    });
  });

  describe('update mutator', () => {
    it('bulk add via update', () => {
      const s = setSignal<number>();
      s.mutate(set => {
        for (let i = 0; i < 10; i++) set.add(i);
      });
      expect(s().size).toBe(10);
    });

    it('computed sees bulk update', () => {
      const s = setSignal<number>();
      const sizeC = computed(() => s().size);
      s.mutate(set => {
        for (let i = 0; i < 5; i++) set.add(i);
      });
      expect(sizeC()).toBe(5);
    });

    it('mixed operations within update', () => {
      const s = setSignal<number>([1, 2, 3]);
      s.mutate(set => {
        set.add(4);
        set.delete(1);
      });
      expect(s().size).toBe(3);
      expect(s().has(1)).toBe(false);
      expect(s().has(4)).toBe(true);
    });

    it('no-op update still invalidates computed', () => {
      const s = setSignal<number>([1]);
      let computeRuns = 0;
      const c = computed(() => {
        computeRuns++;
        return s().size;
      });
      c();
      expect(computeRuns).toBe(1);
      s.mutate(() => { /* no-op */ });
      c();
      expect(computeRuns).toBe(2);
    });
  });

  describe('performance', () => {
    it('1000 mutations on a 10k-entry set complete in <50ms', () => {
      const s = setSignal<number>();
      for (let i = 0; i < 10_000; i++) s.add(i);

      const start = performance.now();
      for (let i = 0; i < 1_000; i++) s.add(i + 10_000);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(50);
    });
  });
});
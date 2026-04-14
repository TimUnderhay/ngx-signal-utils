export function mutate(sig, fn) {
    const current = sig();
    fn(current);
    sig.set({ ...current });
}
export function mutateArray(sig, fn) {
    const current = sig();
    fn(current);
    sig.set([...current]);
}
//# sourceMappingURL=mutate.js.map
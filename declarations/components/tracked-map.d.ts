export interface StructureSignal {
    read(): void;
    bump(): void;
}
export interface ValueCell<V> {
    get(): V;
    set(value: V): void;
}
export interface TrackedMapHooks<V> {
    createStructureSignal(): StructureSignal;
    createValueCell(initial: V): ValueCell<V>;
    isTracking(): boolean;
    schedule(fn: () => void): void;
}
export default class TrackedMap<K, V> {
    private structure;
    private map;
    private hooks;
    private structureBumpScheduled;
    constructor(hooks: TrackedMapHooks<V>);
    private bumpStructure;
    set(key: K, value: V): this;
    get(key: K): V | undefined;
    delete(key: K): boolean;
    keys(): K[];
}

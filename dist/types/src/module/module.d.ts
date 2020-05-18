import { Module as rawModule, ModuleContext } from '../types';
export default class Module<S, R> {
    _children: Record<string, Module<S, R>>;
    _rawModule: rawModule<S, R>;
    context: ModuleContext<S>;
    state: S;
    runtime: boolean;
    constructor(rawModule: rawModule<S, R>, runtime: boolean);
    update(rawModule: rawModule<S, R>): void;
    get namespaced(): boolean;
    getChild(key: string): Module<S, R>;
    addChild(key: string, module: Module<S, R>): void;
    removeChild(key: string): void;
    forEachChild(fn: Function): void;
    forEachGetter(fn: Function): void;
    forEachAction(fn: Function): void;
    forEachMutation(fn: Function): void;
}

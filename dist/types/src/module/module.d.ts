import { Module as rawModule, ModuleContext } from '../types/';
export default class Module<S> {
    _children: Record<string, Module<any>>;
    _rawModule: rawModule<S, S>;
    context: ModuleContext<S>;
    state: S;
    constructor(rawModule: rawModule<S, S>, runtime: boolean);
    get namespaced(): boolean;
    getChild(key: string): Module<any>;
    addChild(key: string, module: Module<S>): void;
    removeChild(key: string): void;
    forEachChild(fn: Function): void;
    forEachGetter(fn: Function): void;
    forEachAction(fn: Function): void;
    forEachMutation(fn: Function): void;
}

import { Module as rawModule } from '../types';
import Module from './module';
export default class ModuleCollection<S, R> {
    root: Module<S, R>;
    constructor(rawModule: rawModule<S, R>);
    get(path: string[]): Module<S, R>;
    register(path: string[], rawModule: rawModule<S, R>, runtime?: boolean): void;
    getNamespace(path: string[]): string;
    unregister(path: string[]): void;
    update<T>(rawRootModule: rawModule<T, S>): void;
}

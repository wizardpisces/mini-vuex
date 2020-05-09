import { Module as rawModule } from '../types/';
import Module from './module';
export default class ModuleCollection<S> {
    root: Module<S>;
    constructor(rawModule: rawModule<S, S>);
    get(path: string[]): Module<S>;
    register(path: string[], rawModule: any, runtime?: boolean): void;
    getNamespace(path: string[]): string;
    unregister(path: string[]): void;
}

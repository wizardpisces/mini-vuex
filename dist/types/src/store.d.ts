import Vue, { WatchOptions } from 'Vue';
import { Store as StoreAbstract, StoreOptions, state, MutationTree, ActionTree, GetterTree, CommitOptions, Module, ModuleOptions } from './types/index';
export default class Store<S> implements StoreAbstract<S> {
    state: state<S>;
    _vm: Vue;
    _watcherVM: Vue;
    _committing: boolean;
    _mutations?: MutationTree<S>;
    _actions?: ActionTree<S, S>;
    getters?: GetterTree<S, S>;
    _devtoolHook?: any;
    strict: boolean;
    _subscribers: Function[];
    _actionSubscribers: Function[];
    constructor(options: StoreOptions<S>);
    _withCommit(fn: Function): void;
    watch<T>(getter: (state: S, getters: any) => T, cb: (value: T, oldValue: T) => void, options?: WatchOptions): (() => void);
    subscribe(sub: Function): () => void;
    subscribeAction(sub: Function): () => void;
    commit(_type: any, _payload?: any, _options?: CommitOptions): void;
    dispatch(_type: any, _payload?: any): Promise<any>;
    registerModule<T>(path: string | string[], rawModule: Module<T, S>, options?: ModuleOptions): void;
}

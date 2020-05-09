import './vue'
import ModuleCollection from '@/module/module-collection';
export interface Store<S> {
    // constructor(options: StoreOptions<S>):void;
    // readonly state: state<S>;
    // readonly getters: any;
    // replaceState(state: S): void;

    dispatch: Dispatch;
    commit: Commit;

    // subscribe<P extends MutationPayload>(fn: (mutation: P, state: S) => any): () => void;
    // subscribeAction<P extends ActionPayload>(fn: SubscribeActionOptions<P, S>): () => void;
    // watch<T>(getter: (state: S, getters: any) => T, cb: (value: T, oldValue: T) => void, options?: WatchOptions): () => void;

    // registerModule<T>(path: string, module: Module<T, S>, options?: ModuleOptions): void;
    // registerModule<T>(path: string[], module: Module<T, S>, options?: ModuleOptions): void;

    // unregisterModule(path: string): void;
    // unregisterModule(path: string[]): void;

    // hotUpdate(options: {
    //     actions?: ActionTree<S, S>;
    //     mutations?: MutationTree<S>;
    //     getters?: GetterTree<S, S>;
    //     modules?: ModuleTree<S>;
    // }): void;
}


export interface StoreOptions<S> {
    state: state<S>;
    getters?: GetterTree<S, S>;
    actions?: ActionTree<S, S>;
    mutations?: MutationTree<S>;
    // modules?: ModuleTree<S>;
    // plugins?: Plugin<S>[];
    strict?: boolean;
}

export type state<S> = S

export interface GetterTree<S, R> {
    [key: string]: Getter<S, R>;
}

export interface ActionTree<S, R> {
    [key: string]: Action<S, R>;
}

export interface MutationTree<S> {
    [key: string]: Mutation<S>;
}

export type Getter<S, R> = (state?: state<S>, getters?: any, rootState?: R, rootGetters?: any) => any;
export type Action<S, R> = ActionHandler<S, R> | ActionObject<S, R>;
export type Mutation<S> = (state: S, payload?: any) => any;

export type ActionHandler<S, R> = (this: Store<R>, injectee: ActionContext<S, R>, payload?: any) => any;
export interface ActionObject<S, R> {
    root?: boolean;
    handler: ActionHandler<S, R>;
}
export interface ActionContext<S, R> {
    dispatch: Dispatch;
    commit: Commit;
    state: state<S>;
    getters: any;
    rootState: R;
    rootGetters: any;
}

export interface Dispatch {
    (type: string, payload?: any, options?: DispatchOptions): Promise<any>;
    <P extends Payload>(payloadWithType: P, options?: DispatchOptions): Promise<any>;
}

export interface Commit {
    (type: string, payload?: any, options?: CommitOptions): void;
    <P extends Payload>(payloadWithType: P, options?: CommitOptions): void;
}

export interface Payload {
    type: string;
}

// export interface MutationPayload extends Payload {
//     payload: any;
// }

// export interface ActionPayload extends Payload {
//     payload: any;
// }

export interface DispatchOptions {
    root?: boolean;
}

export interface CommitOptions {
    silent?: boolean;
    root?: boolean;
}

export type ModuleContext<S> = {
    dispatch:Dispatch;
    commit:Commit;
    getters:any;
    state:any;
    [key:string]:any;
}
export interface Module<S, R> {
    namespaced?: boolean;
    state?: S | (() => S);
    getters?: GetterTree<S, R>;
    actions?: ActionTree<S, R>;
    mutations?: MutationTree<S>;
    modules?: ModuleTree<R>;
}

export interface ModuleTree<R> {
    [key: string]: Module<any, R>;
}

export interface ModuleOptions {
    preserveState?: boolean;
}

export type ActionSubscriber<P, S> = (action: P, state: S) => any;

export interface ActionSubscribersObject<P, S> {
    before?: ActionSubscriber<P, S>;
    after?: ActionSubscriber<P, S>;
}
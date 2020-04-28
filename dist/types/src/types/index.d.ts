import './vue';
export interface Store<S> {
    dispatch: Dispatch;
    commit: Commit;
}
export interface StoreOptions<S> {
    state: state<S>;
    getters?: GetterTree<S, S>;
    actions?: ActionTree<S, S>;
    mutations?: MutationTree<S>;
    strict?: boolean;
}
export declare type state<S> = S;
export interface GetterTree<S, R> {
    [key: string]: Getter<S, R>;
}
export interface ActionTree<S, R> {
    [key: string]: Action<S, R>;
}
export interface MutationTree<S> {
    [key: string]: Mutation<S>;
}
export declare type Getter<S, R> = (state?: state<S>, getters?: any, rootState?: R, rootGetters?: any) => any;
export declare type Action<S, R> = ActionHandler<S, R> | ActionObject<S, R>;
export declare type Mutation<S> = (state: S, payload?: any) => any;
export declare type ActionHandler<S, R> = (this: Store<R>, injectee: ActionContext<S, R>, payload?: any) => any;
export interface ActionObject<S, R> {
    root?: boolean;
    handler: ActionHandler<S, R>;
}
export interface ActionContext<S, R> {
    dispatch: Dispatch;
    commit: Commit;
    state: state<S>;
    getters: any;
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
export interface DispatchOptions {
    root?: boolean;
}
export interface CommitOptions {
    silent?: boolean;
    root?: boolean;
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

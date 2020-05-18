import { Module as rawModule ,ModuleContext,state} from '../types'
import { forEachValue} from '../util'
export default class Module<S,R> {
    _children: Record<string,Module<S,R>>;
    _rawModule:rawModule<S,R>;
    context!: ModuleContext<S>;
    state: S;
    runtime:boolean;
    constructor(rawModule: rawModule<S,R>,runtime:boolean){
        this.runtime = runtime
        // Store some children item
        this._children = Object.create(null)
        // Store the origin module object which passed by programmer
        this._rawModule = rawModule
        const rawState = rawModule.state

        // Store the origin module's state
        this.state = (typeof rawState === 'function' ? (rawState as any)() : rawState) || {}
    }

    update(rawModule: rawModule<S,R>) {
        this._rawModule.namespaced = rawModule.namespaced
        if (rawModule.actions) {
            this._rawModule.actions = rawModule.actions
        }
        if (rawModule.mutations) {
            this._rawModule.mutations = rawModule.mutations
        }
        if (rawModule.getters) {
            this._rawModule.getters = rawModule.getters
        }
    }

    get namespaced() {
        return !!this._rawModule.namespaced
    }

    getChild(key:string) {
        return this._children[key]
    }

    addChild(key:string, module:Module<S,R>) {
        this._children[key] = module
    }

    removeChild(key:string) {
        delete this._children[key]
    }

    forEachChild(fn:Function) {
        forEachValue(this._children, fn)
    }

    forEachGetter(fn: Function) {
        if (this._rawModule.getters) {
            forEachValue(this._rawModule.getters, fn)
        }
    }

    forEachAction(fn: Function) {
        if (this._rawModule.actions) {
            forEachValue(this._rawModule.actions, fn)
        }
    }

    forEachMutation(fn: Function) {
        if (this._rawModule.mutations) {
            forEachValue(this._rawModule.mutations, fn)
        }
    }
}
import { Module as rawModule ,ModuleContext,state} from '../types/'
import { forEachValue} from '../util'
export default class Module<S> {
    _children: Record<string,Module<any>>;
    _rawModule:rawModule<S,S>;
    context!: ModuleContext<S>;
    state: S;
    constructor(rawModule: rawModule<S,S>,runtime:boolean){
        // this.runtime = runtime
        // Store some children item
        this._children = Object.create(null)
        // Store the origin module object which passed by programmer
        this._rawModule = rawModule
        const rawState = rawModule.state

        // Store the origin module's state
        this.state = (typeof rawState === 'function' ? (rawState as any)() : rawState) || {}
    }

    get namespaced() {
        return !!this._rawModule.namespaced
    }

    getChild(key:string) {
        return this._children[key]
    }

    addChild(key:string, module:Module<S>) {
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
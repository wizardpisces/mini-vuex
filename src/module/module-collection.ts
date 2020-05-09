import { Module as rawModule} from '../types/'
import Module from './module';
import {forEachValue} from '../util'

export default class ModuleCollection<S> {
    root!: Module<S>;
    constructor(rawModule: rawModule<S,S>){
        this.register([], rawModule);
    }

    get(path:string[]) {
        return path.reduce((module, key) => {
            return module.getChild(key)
        }, this.root)
    }

    register(path:string[], rawModule:any, runtime = true) {
        // if (process.env.NODE_ENV !== 'production') {
        //     assertRawModule(path, rawModule)
        // }

        const newModule = new Module<S>(rawModule, runtime)
        if (path.length === 0) {
            this.root = newModule
        } else {
            const parent = this.get(path.slice(0, -1))
            parent.addChild(path[path.length - 1], newModule)
        }

        // register nested modules
        if (rawModule.modules) {
            forEachValue(rawModule.modules, (rawChildModule: rawModule<S, S>, key:string) => {
                this.register(path.concat(key), rawChildModule, runtime)
            })
        }
    }

    

    getNamespace(path:string[]) {
        let module = this.root
        return path.reduce((namespace, key) => {
            module = module.getChild(key)
            return namespace + (module.namespaced ? key + '/' : '')
        }, '')
    }

    unregister(path:string[]) {
        const parent = this.get(path.slice(0, -1))
        const key = path[path.length - 1]
        // if (!parent.getChild(key).runtime) return

        parent.removeChild(key)
    }
}
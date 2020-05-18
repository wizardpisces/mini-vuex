import { Module as rawModule} from '../types'
import Module from './module';
import { forEachValue, assert} from '../util'

export default class ModuleCollection<S,R> {
    root!: Module<S,R>;
    constructor(rawModule: rawModule<S,R>){
        this.register([], rawModule, false);
    }

    get(path:string[]) {
        return path.reduce((module, key) => {
            return module.getChild(key)
        }, this.root)
    }

    register(path: string[], rawModule: rawModule<S,R>, runtime = true) {
        if (process.env.NODE_ENV !== 'production') {
            assertRawModule(path, rawModule)
        }

        const newModule = new Module<S,R>(rawModule, runtime)
        if (path.length === 0) {
            this.root = newModule
        } else {
            const parent = this.get(path.slice(0, -1))
            parent.addChild(path[path.length - 1], newModule)
        }

        // register nested modules
        if (rawModule.modules) {
            forEachValue(rawModule.modules, (rawChildModule: rawModule<S, R>, key:string) => {
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

        if (!parent.getChild(key).runtime) return

        parent.removeChild(key)
    }

    update<T>(rawRootModule:rawModule<T,S>) {
        update([], this.root, rawRootModule)
    }

}

function update(path:string[], targetModule:Module<any,any>, newModule:rawModule<any,any>) {
    if (process.env.NODE_ENV !== 'production') {
        assertRawModule(path, newModule)
    }

    // update target module
    targetModule.update(newModule)

    // update nested modules
    if (newModule.modules) {
        for (const key in newModule.modules) {
            if (!targetModule.getChild(key)) {
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(
                        `[vuex] trying to add a new module '${key}' on hot reloading, ` +
                        'manual reload is needed'
                    )
                }
                return
            }
            update(
                path.concat(key),
                targetModule.getChild(key),
                newModule.modules[key]
            )
        }
    }
}

const functionAssert = {
    assert: (value:any) => typeof value === 'function',
    expected: 'function'
}

const objectAssert = {
    assert: (value:any) => typeof value === 'function' ||
        (typeof value === 'object' && typeof value.handler === 'function'),
    expected: 'function or object with "handler" function'
}


const assertTypes:any = {
    getters: functionAssert,
    mutations: functionAssert,
    actions: objectAssert
}

function assertRawModule(path: string[], rawModule:any) {
    Object.keys(assertTypes).forEach((key:string) => {
        if (!rawModule[key]) return

        const assertOptions = assertTypes[key]

        forEachValue(rawModule[key], (value:any, type:string) => {
            assert(
                assertOptions.assert(value),
                makeAssertionMessage(path, key, type, value, assertOptions.expected)
            )
        })
    })
}

function makeAssertionMessage(path:string[], key:string, type:string, value:any, expected:string) {
    let buf = `${key} should be ${expected} but "${key}.${type}"`
    if (path.length > 0) {
        buf += ` in module "${path.join('.')}"`
    }
    buf += ` is ${JSON.stringify(value)}.`
    return buf
}
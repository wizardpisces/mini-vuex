export function isPromise(val:Promise<any>) {
    return val && typeof val.then === 'function'
}

export function assert(condition:boolean, msg:string) {
    if (!condition) throw new Error(`[vuex] ${msg}`)
}


export function isObject(obj:any) {
    return obj !== null && typeof obj === 'object'
}

export function isUndefined(val:any) {
    return val === undefined
}

/**
 * forEach for object
 */
export function forEachValue(obj:any, fn:Function) {
    Object.keys(obj).forEach(key => fn(obj[key], key))
}


export function partial(fn:Function, arg:any) {
    return function () {
        return fn(arg)
    }
}

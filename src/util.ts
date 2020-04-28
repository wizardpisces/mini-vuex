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

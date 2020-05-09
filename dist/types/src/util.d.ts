export declare function isPromise(val: Promise<any>): boolean;
export declare function assert(condition: boolean, msg: string): void;
export declare function isObject(obj: any): boolean;
export declare function isUndefined(val: any): boolean;
/**
 * forEach for object
 */
export declare function forEachValue(obj: any, fn: Function): void;
export declare function partial(fn: Function, arg: any): () => any;

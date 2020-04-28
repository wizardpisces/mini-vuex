import Vue, { WatchOptions} from 'Vue';
import { isObject, isPromise, assert } from './util'
import { Store as StoreAbstract, StoreOptions, state, MutationTree, ActionTree, GetterTree, CommitOptions, Module, ModuleOptions} from './types/index'
import install from "./install";


export default class Store<S> implements StoreAbstract<S>{

	state: state<S>;
	_vm!:Vue;
	_watcherVM!:Vue;
	_committing:boolean = false;
	_mutations?: MutationTree<S>;
	_actions?: ActionTree<S, S>;
	getters?: GetterTree<S, S>;
	_devtoolHook?: any;
	strict:boolean =  false;
	_subscribers:Function[] = [];
	_actionSubscribers:Function[] = [];

	constructor(options: StoreOptions<S>) {
		// super(options)
		

		options = options || {};

		if (process.env.NODE_ENV !== 'production') {
			// assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`)
			// assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
			assert(this instanceof Store, `store must be called with the new operator.`)
		}

		const {
			state,
			mutations,
			actions,
			getters,
			strict = false
		} = options;

		this.state = (typeof state === 'function' ? state() : state) || {}
		this.getters = getters;
		this._mutations = mutations;
		this._actions = actions;
		this._watcherVM = new Vue()

		this.strict = strict;

		install(Vue);
		resetStoreVM(this, state)
	}

	_withCommit(fn:Function) {
		const committing = this._committing
		this._committing = true
		fn()
		this._committing = committing
	}
	// watch<T>(getter: (state: S, getters: any) => T, cb: (value: T, oldValue: T) => void, options?: WatchOptions): () => void;

	watch<T>(getter: (state: S, getters: any) => T, cb: (value: T, oldValue: T) => void, options?: WatchOptions):(() => void) {
		if (process.env.NODE_ENV !== 'production') {
			assert(typeof getter === 'function', `store.watch only accepts a function.`)
		}
		return this._watcherVM.$watch(() => getter(this.state, this.getters), cb, options)
	}

	// get state(){
	// 	return this.state
	// }

	// set state(v){
	// 	if (process.env.NODE_ENV !== 'production') {
	// 		assert(false, `use store.replaceState() to explicit replace store state.`)
	// 	}
	// }

	subscribe(sub:Function){
		return genericSubscribe(sub, this._subscribers)
	}

	subscribeAction(sub:Function){
		return genericSubscribe(sub, this._actionSubscribers)
	}

	commit(_type: any, _payload?: any, _options?: CommitOptions) {
		const {
			type,
			payload,
			options
		} = unifyObjectStyle(_type, _payload, _options)

		if (options && options.silent) {
			console.warn(`[vuex] mutation type: ${type}. Silent option has been removed. ` +
				'Use the filter functionality in the vue-devtools')
		}

		this._subscribers.slice().forEach(sub=>sub({type,payload},this.state))
		this._withCommit(()=>{
			this._mutations && this._mutations[type](this.state as S, payload)
		})
	}

	dispatch(_type: any, _payload?: any): Promise<any> {
		const {
			type,
			payload
		} = unifyObjectStyle(_type, _payload);

		let handler;

		if (!this._actions) {
			return promiseError(`[vuex]: missing actions`)
		}

		const action = this._actions[type]
		if (!action) {
			if (process.env.NODE_ENV !== 'production') {
				return promiseError(`[vuex]: unknow action type: ${type}`)
			}
		}

		if(typeof action === 'function'){
			handler = action
		}else{
			handler = action.handler
		}

		this._actionSubscribers.slice().forEach(sub=>sub({type,payload},this.state))

		let res = handler.call(this, {
			commit: this.commit.bind(this),
			dispatch: this.dispatch.bind(this),
			getters: this.getters,
			state: this.state
		}, payload)

		if (!isPromise(res)) {
			res = Promise.resolve(res)
		}
		if (this._devtoolHook) {
			return res.catch((err: any) => {
				this._devtoolHook.emit('vuex:error', err)
				throw err
			})
		} else {
			return res
		}
	}

	//registerModule<T>(path: string, module: Module<T, S>, options?: ModuleOptions): void;
	registerModule<T>(path: string | string[], rawModule: Module<T, S>, options: ModuleOptions = {}) {
		if (typeof path === 'string') path = [path]

		if (process.env.NODE_ENV !== 'production') {
			assert(Array.isArray(path), `module path must be a string or an Array.`)
			assert(path.length > 0, 'cannot register the root module by using registerModule.')
		}

		// this._modules.register(path, rawModule)
		// installModule(this, this.state, path, this._modules.get(path), options.preserveState)
		// // reset store to update getters...
		// resetStoreVM(this, this.state)
	}
}

function unifyObjectStyle(type: any, payload?: any, options?: any): { type: string, [key: string]: any } {
	if (isObject(type) && type.type) {
		options = payload
		payload = type
		type = type.type
	}

	if (process.env.NODE_ENV !== 'production') {
		assert(typeof type === 'string', `expects string as the type, but found ${typeof type}.`)
	}

	return { type, payload, options }
}

function promiseError(msg: any): Promise<any> {
	console.error(msg)
	return Promise.resolve(msg)
}


function genericSubscribe(sub:Function,subscribers:Function[]){
	let index = subscribers.push(sub);
	return () => {
		subscribers.splice(index - 1, 1)
	}
}

function enableStrictMode(store:any) {
	store._vm.$watch(function () { return store._vm._data.$$state }, () => {
		if (process.env.NODE_ENV !== 'production') {
			assert(store._committing, `do not mutate vuex store state outside mutation handlers.`)
		}
	}, { deep: true, sync: true })
}


function resetStoreVM(store: Store<any>, state: state<any>) {
	let computed = {}
	function transformGetters(getters: GetterTree<any, any> = {}, store: Store<any>) {
		let getterProxy = {}
		Object.keys(getters).map((fnName) => {
			Object.defineProperty(getterProxy, fnName, {
				get() {
					return getters[fnName](store.state)
				}
			})
		})

		return getterProxy;
	}
	store._vm = new Vue({
		data:()=>{
			return {$$state : state}
		},
		computed
	})
	store.getters = transformGetters(store.getters, store)

	if (store.strict) {
		enableStrictMode(store)
	}
	
}
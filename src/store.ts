import { WatchOptions} from 'Vue';
import { isObject, isPromise, assert, forEachValue, partial} from './util'
import { Store as StoreAbstract, StoreOptions, state, MutationTree, Mutation, ActionTree, GetterTree, CommitOptions, Module as rawModule, ModuleContext, ModuleOptions, Payload, Action, ActionHandler, Getter, ActionSubscribersObject} from './types/index'
// import install from "./install";
import applyMixin from './mixin'

import ModuleCollection from './module/module-collection';
import Module from './module/module'
const __DEV__ = process.env.NODE_ENV !== 'production'

let Vue:any;

export default class Store<S> implements StoreAbstract<S>{
	_vm:any;
	_watcherVM:any;
	_committing:boolean = false;
	_mutations: Record<string, Mutation<S>[]>;
	_actions?: ActionTree<S, S>;
	getters?: GetterTree<S, S>;
	_modules: ModuleCollection<any,S>;
	_devtoolHook?: any;
	strict:boolean =  false;
	_subscribers:Function[] = [];
	_actionSubscribers: ActionSubscribersObject<S,S>[] = [];
	_makeLocalGettersCache:Record<string,any>;
	_wrappedGetters:Record<string,Function>;
	_modulesNamespaceMap:Record<string,Module<any,S>>;

	constructor(options: StoreOptions<S>) {
		// super(options)
		options = options || {};
		// Auto install if it is not done yet and `window` has `Vue`.
		// To allow users to avoid auto-installation in some cases,
		// this code should be placed here. See #731
		if (!Vue && typeof window !== 'undefined' && window.Vue) {
			console.log('install vue')
			install(window.Vue)
		}
		if (process.env.NODE_ENV !== 'production') {
			// assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`)
			// assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
			assert(this instanceof Store, `store must be called with the new operator.`)
		}

		const {
			strict = false,
			plugins = []
		} = options;

		// store internal state
		this._committing = false
		this._actions = Object.create(null)
		this._actionSubscribers = []
		this._mutations = Object.create(null)
		this._wrappedGetters = Object.create(null)
		this._modules = new ModuleCollection(options)
		this._modulesNamespaceMap = Object.create(null)
		this._subscribers = []
		this._watcherVM = new Vue()
		this._makeLocalGettersCache = Object.create(null)

		const store = this
		const { dispatch, commit } = this
		this.dispatch = function boundDispatch(type, payload) {
			return dispatch.call(store, type, payload)
		}
		this.commit = function boundCommit(type, payload, options) {
			return commit.call(store, type, payload, options)
		}

		this.strict = strict;

		const state = this._modules.root.state

		installModule(this, state, [], this._modules.root)


		resetStoreVM(this, state)

		// apply plugins
		plugins.forEach(plugin => plugin(this))
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

	get state() {
		return this._vm._data.$$state
	}

	set state(v) {
		if (__DEV__) {
			assert(false, `use store.replaceState() to explicit replace store state.`)
		}
	}

	replaceState(state:S) {
		this._withCommit(() => {
			this._vm._data.$$state = state
		})
	}

	subscribe(sub:Function){
		return genericSubscribe(sub, this._subscribers)
	}

	subscribeAction(sub: ActionSubscribersObject<S,S>){
		const subs = typeof sub === 'function' ? { before: sub } : sub
		return genericSubscribe(subs, this._actionSubscribers)
	}

	commit(_type: any, _payload?: any, _options?: CommitOptions) {
		// check object-style commit
		const {
			type,
			payload,
			options
		} = unifyObjectStyle(_type, _payload, _options)

		const mutation = { type, payload }
		const entry = this._mutations[type]
		if (!entry) {
			if (process.env.NODE_ENV !== 'production') {
				console.error(`[vuex] unknown mutation type: ${type}`)
			}
			return
		}
		this._withCommit(() => {
			entry.forEach(function commitIterator(handler) {
				handler(payload)
			})
		})

		this._subscribers
			.slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
			.forEach(sub => sub(mutation, this.state))

		if (
			process.env.NODE_ENV !== 'production' &&
			options && options.silent
		) {
			console.warn(
				`[vuex] mutation type: ${type}. Silent option has been removed. ` +
				'Use the filter functionality in the vue-devtools'
			)
		}
	}

	dispatch(_type: any, _payload?: any): Promise<any> {
		const {
			type,
			payload
		} = unifyObjectStyle(_type, _payload)

		const action = { type, payload }
		const entry = (this._actions as any)[type]
		if (!entry) {
			if (process.env.NODE_ENV !== 'production') {
				console.error(`[vuex] unknown action type: ${type}`)
			}
			return Promise.resolve(false)
		}

		try {
			this._actionSubscribers
				.slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
				.filter(sub => sub.before)
				.forEach(sub => (sub.before as any)(action, this.state))
		} catch (e) {
			if (process.env.NODE_ENV !== 'production') {
				console.warn(`[vuex] error in before action subscribers: `)
				console.error(e)
			}
		}

		const result = entry.length > 1
			? Promise.all(entry.map((handler:Function) => handler(payload)))
			: entry[0](payload)

		return result.then((res:any) => {
			try {
				this._actionSubscribers
					.filter(sub => sub.after)
					.forEach(sub => (sub.after as any)(action, this.state))
			} catch (e) {
				if (process.env.NODE_ENV !== 'production') {
					console.warn(`[vuex] error in after action subscribers: `)
					console.error(e)
				}
			}
			return res
		})
	}

	hotUpdate<T>(newOptions:rawModule<T,S>) {
		this._modules.update(newOptions)
		resetStore(this, true)
	}

	//registerModule<T>(path: string, module: Module<T, S>, options?: ModuleOptions): void;
	registerModule<T>(path: string | string[], rawModule: rawModule<T, S>, options: ModuleOptions = {}) {
		if (typeof path === 'string') path = [path]

		if (process.env.NODE_ENV !== 'production') {
			assert(Array.isArray(path), `module path must be a string or an Array.`)
			assert(path.length > 0, 'cannot register the root module by using registerModule.')
		}

		this._modules.register(path, rawModule)
		installModule(this, this.state, path, this._modules.get(path), options.preserveState)
		// reset store to update getters...
		resetStoreVM(this, this.state)
	}

	unregisterModule(path:any) {
		if (typeof path === 'string') path = [path]

		// if (process.env.NODE_ENV !== 'production') {
		// 	assert(Array.isArray(path), `module path must be a string or an Array.`)
		// }

		this._modules.unregister(path)
		this._withCommit(() => {
			const parentState = getNestedState(this.state, path.slice(0, -1))
			Vue.delete(parentState, path[path.length - 1])
		})
		resetStore(this)
	}
}

function resetStore(store:any, hot:boolean = false) {
	store._actions = Object.create(null)
	store._mutations = Object.create(null)
	store._wrappedGetters = Object.create(null)
	store._modulesNamespaceMap = Object.create(null)
	const state = store.state
	// init all modules
	installModule(store, state, [], store._modules.root, true)
	// reset vm
	resetStoreVM(store, state, hot)
}


function installModule(store: Store<any>, rootState: state<any>, path:string[], module:Module<any,any>, hot?:any) {
	const isRoot = !path.length
	const namespace = store._modules.getNamespace(path)

	// register in namespace map
	if (module.namespaced) {
		// if (store._modulesNamespaceMap[namespace] && process.env.NODE_ENV !== 'production') {
		// 	console.error(`[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join('/')}`)
		// }
		store._modulesNamespaceMap[namespace] = module
	}

	// set state
	if (!isRoot && !hot) {
		const parentState = getNestedState(rootState, path.slice(0, -1))
		const moduleName = path[path.length - 1]
		store._withCommit(() => {
			if (process.env.NODE_ENV !== 'production') {
				if (moduleName in parentState) {
					console.warn(
						`[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join('.')}"`
					)
				}
			}
			Vue.set(parentState, moduleName, module.state)
		})
	}

	const local = module.context = makeLocalContext(store, namespace, path) as ModuleContext<any>;

	module.forEachMutation((mutation: Mutation<any>, key:string) => {
		const namespacedType = namespace + key
		registerMutation(store, namespacedType, mutation, local)
	})

	module.forEachAction((action: Action<any,any>, key:string) => {

		const type = (action as any).root ? key : namespace + key
		const handler = (action as any).handler || action
		registerAction(store, type, handler, local)
	})

	module.forEachGetter((getter: Getter<any,any>, key:string) => {
		const namespacedType = namespace + key
		registerGetter(store, namespacedType, getter, local)
	})

	module.forEachChild((child:Module<any,any>, key:string) => {
		installModule(store, rootState, path.concat(key), child, hot)
	})
}


function registerMutation(store: any, type: string, handler: Mutation<any>, local: ModuleContext<any>) {
	const entry = store._mutations[type] || (store._mutations[type] = [])
	entry.push(function wrappedMutationHandler(payload:Payload) {
		handler.call(store, local.state, payload)
	})
}

function registerAction(store: any, type: string, handler: ActionHandler<any,any>, local: ModuleContext<any>) {
	const entry = store._actions[type] || (store._actions[type] = [])
	entry.push(function wrappedActionHandler(payload:Payload) {
		let res = handler.call(store, {
			dispatch: local.dispatch,
			commit: local.commit,
			getters: local.getters,
			state: local.state,
			rootGetters: store.getters,
			rootState: store.state
		}, payload)
		if (!isPromise(res)) {
			res = Promise.resolve(res)
		}
		if (store._devtoolHook) {
			return res.catch((err:any) => {
				store._devtoolHook.emit('vuex:error', err)
				throw err
			})
		} else {
			return res
		}
	})
}

function registerGetter(store: any, type: string, rawGetter: Getter<any, any>, local: ModuleContext<any>) {
	if (store._wrappedGetters[type]) {
		if (process.env.NODE_ENV !== 'production') {
			console.error(`[vuex] duplicate getter key: ${type}`)
		}
		return
	}
	store._wrappedGetters[type] = function wrappedGetter(store:any) {
		return rawGetter(
			local.state, // local state
			local.getters, // local getters
			store.state, // root state
			store.getters // root getters
		)
	}
}

function makeLocalContext(store:Store<any>, namespace:string, path:string[]) {
	const noNamespace = namespace === ''

	const local = {
		dispatch: noNamespace ? store.dispatch : (_type:any, _payload:any, _options:any) => {
			const args = unifyObjectStyle(_type, _payload, _options)
			const { payload, options } = args
			let { type } = args

			if (!options || !options.root) {
				type = namespace + type
				if (process.env.NODE_ENV !== 'production' && !(store._actions as any)[type]) {
					console.error(`[vuex] unknown local action type: ${args.type}, global type: ${type}`)
					return
				}
			}

			return store.dispatch(type, payload)
		},

		commit: noNamespace ? store.commit : (_type: any, _payload: any, _options: any) => {
			const args = unifyObjectStyle(_type, _payload, _options)
			const { payload, options } = args
			let { type } = args

			if (!options || !options.root) {
				type = namespace + type
				if (process.env.NODE_ENV !== 'production' && !(store._mutations as any)[type]) {
					console.error(`[vuex] unknown local mutation type: ${args.type}, global type: ${type}`)
					return
				}
			}

			store.commit(type, payload, options)
		}
	}

	// getters and state object must be gotten lazily
	// because they will be changed by vm update
	Object.defineProperties(local, {
		getters: {
			get: noNamespace
				? () => store.getters
				: () => makeLocalGetters(store, namespace)
		},
		state: {
			get: () => getNestedState(store.state, path)
		}
	})

	return local
}

function makeLocalGetters(store:Store<any>, namespace:string) {
	if (!store._makeLocalGettersCache[namespace]) {
		const gettersProxy = {}
		const splitPos = namespace.length
		Object.keys(store.getters as object).forEach((type) => {
			// skip if the target getter is not match this namespace
			if (type.slice(0, splitPos) !== namespace) return

			// extract local getter type
			const localType = type.slice(splitPos)

			// Add a port to the getters proxy.
			// Define as getter property because
			// we do not want to evaluate the getters in this time.
			Object.defineProperty(gettersProxy, localType, {
				get: () => (store.getters as any)[type],
				enumerable: true
			})
		})
		store._makeLocalGettersCache[namespace] = gettersProxy
	}

	return store._makeLocalGettersCache[namespace]
}

function getNestedState(state:state<any>, path:string[]) {
	return path.reduce((state, key) => state[key], state)
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

function genericSubscribe(sub: any, subscribers: any[]){
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


function resetStoreVM(store: Store<any>, state: state<any>,hot?:any) {
	const oldVm = store._vm

	// bind store public getters
	store.getters = {}
	// reset local getters cache
	store._makeLocalGettersCache = Object.create(null)
	const wrappedGetters = store._wrappedGetters
	const computed:any = {}
	forEachValue(wrappedGetters, (fn:Function, key:string) => {
		// use computed to leverage its lazy-caching mechanism
		// direct inline function use will lead to closure preserving oldVm.
		// using partial to return function with only arguments preserved in closure environment.
		computed[key] = partial(fn, store)
		Object.defineProperty(store.getters, key, {
			get: () => store._vm[key],
			enumerable: true // for local getters
		})
	})

	// use a Vue instance to store the state tree
	// suppress warnings just in case the user has added
	// some funky global mixins
	// const silent = Vue.config.silent
	// Vue.config.silent = true
	store._vm = new Vue({
		data: {
			$$state: state
		},
		computed
	})
	// Vue.config.silent = silent

	// enable strict mode for new vm
	if (store.strict) {
		enableStrictMode(store)
	}

	if (oldVm) {
		if (hot) {
			// dispatch changes in all subscribed watchers
			// to force getter re-evaluation for hot reloading.
			store._withCommit(() => {
				oldVm._data.$$state = null
			})
		}
		Vue.nextTick(() => oldVm.$destroy())
	}
	
}


export function install(_Vue:any) {
	// if (Vue && _Vue === Vue) {
	// 	if (__DEV__) {
	// 		console.error(
	// 			'[vuex] already installed. Vue.use(Vuex) should be called only once.'
	// 		)
	// 	}
	// 	return
	// }
	Vue = _Vue
	applyMixin(Vue)
}
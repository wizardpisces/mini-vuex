/**
  * mini-vuex v0.0.1
  * (c) 2020 wizardpisces
  * @license MIT
  */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Vue = _interopDefault(require('Vue'));

function isPromise(val) {
    return val && typeof val.then === 'function';
}
function assert(condition, msg) {
    if (!condition)
        { throw new Error(("[vuex] " + msg)); }
}
function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}
/**
 * forEach for object
 */
function forEachValue(obj, fn) {
    Object.keys(obj).forEach(function (key) { return fn(obj[key], key); });
}
function partial(fn, arg) {
    return function () {
        return fn(arg);
    };
}

function install (Vue) {
    /**
     * Vuex init hook, injected into each instances init hooks list.
     */
    Vue.mixin({
        beforeCreate: function () {
            var options = this.$options;
            // store injection
            if (options.store) {
                this.$store = typeof options.store === 'function' ?
                    options.store() :
                    options.store;
            }
            else if (options.parent && options.parent.$store) {
                this.$store = options.parent.$store;
            }
        }
    });
}

var Module = function Module(rawModule, runtime) {
    // this.runtime = runtime
    // Store some children item
    this._children = Object.create(null);
    // Store the origin module object which passed by programmer
    this._rawModule = rawModule;
    var rawState = rawModule.state;
    // Store the origin module's state
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {};
};

var prototypeAccessors = { namespaced: { configurable: true } };
prototypeAccessors.namespaced.get = function () {
    return !!this._rawModule.namespaced;
};
Module.prototype.getChild = function getChild (key) {
    return this._children[key];
};
Module.prototype.addChild = function addChild (key, module) {
    this._children[key] = module;
};
Module.prototype.removeChild = function removeChild (key) {
    delete this._children[key];
};
Module.prototype.forEachChild = function forEachChild (fn) {
    forEachValue(this._children, fn);
};
Module.prototype.forEachGetter = function forEachGetter (fn) {
    if (this._rawModule.getters) {
        forEachValue(this._rawModule.getters, fn);
    }
};
Module.prototype.forEachAction = function forEachAction (fn) {
    if (this._rawModule.actions) {
        forEachValue(this._rawModule.actions, fn);
    }
};
Module.prototype.forEachMutation = function forEachMutation (fn) {
    if (this._rawModule.mutations) {
        forEachValue(this._rawModule.mutations, fn);
    }
};

Object.defineProperties( Module.prototype, prototypeAccessors );

var ModuleCollection = function ModuleCollection(rawModule) {
    this.register([], rawModule);
};
ModuleCollection.prototype.get = function get (path) {
    return path.reduce(function (module, key) {
        return module.getChild(key);
    }, this.root);
};
ModuleCollection.prototype.register = function register (path, rawModule, runtime) {
        var this$1 = this;
        if ( runtime === void 0 ) runtime = true;

    // if (process.env.NODE_ENV !== 'production') {
    // assertRawModule(path, rawModule)
    // }
    var newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
        this.root = newModule;
    }
    else {
        var parent = this.get(path.slice(0, -1));
        parent.addChild(path[path.length - 1], newModule);
    }
    // register nested modules
    if (rawModule.modules) {
        forEachValue(rawModule.modules, function (rawChildModule, key) {
            this$1.register(path.concat(key), rawChildModule, runtime);
        });
    }
};
ModuleCollection.prototype.getNamespace = function getNamespace (path) {
    var module = this.root;
    return path.reduce(function (namespace, key) {
        module = module.getChild(key);
        return namespace + (module.namespaced ? key + '/' : '');
    }, '');
};
ModuleCollection.prototype.unregister = function unregister (path) {
    var parent = this.get(path.slice(0, -1));
    var key = path[path.length - 1];
    // if (!parent.getChild(key).runtime) return
    parent.removeChild(key);
};

var Store = function Store(options) {
    this._committing = false;
    this.strict = false;
    this._subscribers = [];
    this._actionSubscribers = [];
    // super(options)
    options = options || {};
    // Auto install if it is not done yet and `window` has `Vue`.
    // To allow users to avoid auto-installation in some cases,
    // this code should be placed here. See #731
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
        install(window.Vue);
    }
    if (process.env.NODE_ENV !== 'production') {
        // assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`)
        // assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
        assert(this instanceof Store, "store must be called with the new operator.");
    }
    var strict = options.strict; if ( strict === void 0 ) strict = false;
    // store internal state
    this._committing = false;
    this._actions = Object.create(null);
    this._actionSubscribers = [];
    this._mutations = Object.create(null);
    this._wrappedGetters = Object.create(null);
    this._modules = new ModuleCollection(options);
    this._modulesNamespaceMap = Object.create(null);
    this._subscribers = [];
    this._watcherVM = new Vue();
    this._makeLocalGettersCache = Object.create(null);
    var store = this;
    var ref = this;
    var dispatch = ref.dispatch;
    var commit = ref.commit;
    this.dispatch = function boundDispatch(type, payload) {
        return dispatch.call(store, type, payload);
    };
    this.commit = function boundCommit(type, payload, options) {
        return commit.call(store, type, payload, options);
    };
    this.strict = strict;
    var state = this._modules.root.state;
    installModule(this, state, [], this._modules.root);
    resetStoreVM(this, state);
};

var prototypeAccessors$1 = { state: { configurable: true } };
Store.prototype._withCommit = function _withCommit (fn) {
    var committing = this._committing;
    this._committing = true;
    fn();
    this._committing = committing;
};
// watch<T>(getter: (state: S, getters: any) => T, cb: (value: T, oldValue: T) => void, options?: WatchOptions): () => void;
Store.prototype.watch = function watch (getter, cb, options) {
        var this$1 = this;

    if (process.env.NODE_ENV !== 'production') {
        assert(typeof getter === 'function', "store.watch only accepts a function.");
    }
    return this._watcherVM.$watch(function () { return getter(this$1.state, this$1.getters); }, cb, options);
};
prototypeAccessors$1.state.get = function () {
    return this._vm._data.$$state;
};
Store.prototype.replaceState = function replaceState (state) {
        var this$1 = this;

    this._withCommit(function () {
        this$1._vm._data.$$state = state;
    });
};
Store.prototype.subscribe = function subscribe (sub) {
    return genericSubscribe(sub, this._subscribers);
};
Store.prototype.subscribeAction = function subscribeAction (sub) {
    var subs = typeof sub === 'function' ? { before: sub } : sub;
    return genericSubscribe(subs, this._actionSubscribers);
};
Store.prototype.commit = function commit (_type, _payload, _options) {
        var this$1 = this;

    // check object-style commit
    var ref = unifyObjectStyle(_type, _payload, _options);
        var type = ref.type;
        var payload = ref.payload;
        var options = ref.options;
    var mutation = { type: type, payload: payload };
    var entry = this._mutations[type];
    if (!entry) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(("[vuex] unknown mutation type: " + type));
        }
        return;
    }
    this._withCommit(function () {
        entry.forEach(function commitIterator(handler) {
            handler(payload);
        });
    });
    this._subscribers
        .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
        .forEach(function (sub) { return sub(mutation, this$1.state); });
    if (process.env.NODE_ENV !== 'production' &&
        options && options.silent) {
        console.warn("[vuex] mutation type: " + type + ". Silent option has been removed. " +
            'Use the filter functionality in the vue-devtools');
    }
};
Store.prototype.dispatch = function dispatch (_type, _payload) {
        var this$1 = this;

    var ref = unifyObjectStyle(_type, _payload);
        var type = ref.type;
        var payload = ref.payload;
    var action = { type: type, payload: payload };
    var entry = this._actions[type];
    if (!entry) {
        if (process.env.NODE_ENV !== 'production') {
            console.error(("[vuex] unknown action type: " + type));
        }
        return Promise.resolve(false);
    }
    try {
        this._actionSubscribers
            .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
            .filter(function (sub) { return sub.before; })
            .forEach(function (sub) { return sub.before(action, this$1.state); });
    }
    catch (e) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn("[vuex] error in before action subscribers: ");
            console.error(e);
        }
    }
    var result = entry.length > 1
        ? Promise.all(entry.map(function (handler) { return handler(payload); }))
        : entry[0](payload);
    return result.then(function (res) {
        // try {
        // 	this._actionSubscribers
        // 		.filter(sub => sub.after)
        // 		.forEach(sub => sub.after(action, this.state))
        // } catch (e) {
        // 	if (process.env.NODE_ENV !== 'production') {
        // 		console.warn(`[vuex] error in after action subscribers: `)
        // 		console.error(e)
        // 	}
        // }
        return res;
    });
};
//registerModule<T>(path: string, module: Module<T, S>, options?: ModuleOptions): void;
Store.prototype.registerModule = function registerModule (path, rawModule, options) {
        if ( options === void 0 ) options = {};

    if (typeof path === 'string')
        { path = [path]; }
    if (process.env.NODE_ENV !== 'production') {
        assert(Array.isArray(path), "module path must be a string or an Array.");
        assert(path.length > 0, 'cannot register the root module by using registerModule.');
    }
    this._modules.register(path, rawModule);
    installModule(this, this.state, path, this._modules.get(path), options.preserveState);
    // reset store to update getters...
    resetStoreVM(this, this.state);
};
Store.prototype.unregisterModule = function unregisterModule (path) {
        var this$1 = this;

    if (typeof path === 'string')
        { path = [path]; }
    // if (process.env.NODE_ENV !== 'production') {
    // 	assert(Array.isArray(path), `module path must be a string or an Array.`)
    // }
    this._modules.unregister(path);
    this._withCommit(function () {
        var parentState = getNestedState(this$1.state, path.slice(0, -1));
        Vue.delete(parentState, path[path.length - 1]);
    });
    resetStore(this);
};

Object.defineProperties( Store.prototype, prototypeAccessors$1 );
function resetStore(store, hot) {
    store._actions = Object.create(null);
    store._mutations = Object.create(null);
    store._wrappedGetters = Object.create(null);
    store._modulesNamespaceMap = Object.create(null);
    var state = store.state;
    // init all modules
    installModule(store, state, [], store._modules.root, true);
    // reset vm
    resetStoreVM(store, state);
}
function installModule(store, rootState, path, module, hot) {
    var isRoot = !path.length;
    var namespace = store._modules.getNamespace(path);
    // register in namespace map
    if (module.namespaced) {
        // if (store._modulesNamespaceMap[namespace] && process.env.NODE_ENV !== 'production') {
        // 	console.error(`[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join('/')}`)
        // }
        store._modulesNamespaceMap[namespace] = module;
    }
    // set state
    if (!isRoot && !hot) {
        var parentState = getNestedState(rootState, path.slice(0, -1));
        var moduleName = path[path.length - 1];
        store._withCommit(function () {
            // if (process.env.NODE_ENV !== 'production') {
            // 	if (moduleName in parentState) {
            // 		console.warn(
            // 			`[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join('.')}"`
            // 		)
            // 	}
            // }
            Vue.set(parentState, moduleName, module.state);
        });
    }
    var local = module.context = makeLocalContext(store, namespace, path);
    module.forEachMutation(function (mutation, key) {
        var namespacedType = namespace + key;
        registerMutation(store, namespacedType, mutation, local);
    });
    module.forEachAction(function (action, key) {
        var type = action.root ? key : namespace + key;
        var handler = action.handler || action;
        registerAction(store, type, handler, local);
    });
    module.forEachGetter(function (getter, key) {
        var namespacedType = namespace + key;
        registerGetter(store, namespacedType, getter, local);
    });
    module.forEachChild(function (child, key) {
        installModule(store, rootState, path.concat(key), child, hot);
    });
}
function registerMutation(store, type, handler, local) {
    var entry = store._mutations[type] || (store._mutations[type] = []);
    entry.push(function wrappedMutationHandler(payload) {
        handler.call(store, local.state, payload);
    });
}
function registerAction(store, type, handler, local) {
    var entry = store._actions[type] || (store._actions[type] = []);
    entry.push(function wrappedActionHandler(payload) {
        var res = handler.call(store, {
            dispatch: local.dispatch,
            commit: local.commit,
            getters: local.getters,
            state: local.state,
            rootGetters: store.getters,
            rootState: store.state
        }, payload);
        if (!isPromise(res)) {
            res = Promise.resolve(res);
        }
        if (store._devtoolHook) {
            return res.catch(function (err) {
                store._devtoolHook.emit('vuex:error', err);
                throw err;
            });
        }
        else {
            return res;
        }
    });
}
function registerGetter(store, type, rawGetter, local) {
    // if (store._wrappedGetters[type]) {
    // 	if (process.env.NODE_ENV !== 'production') {
    // 		console.error(`[vuex] duplicate getter key: ${type}`)
    // 	}
    // 	return
    // }
    store._wrappedGetters[type] = function wrappedGetter(store) {
        return rawGetter(local.state, // local state
        local.getters, // local getters
        store.state, // root state
        store.getters // root getters
        );
    };
}
function makeLocalContext(store, namespace, path) {
    var noNamespace = namespace === '';
    var local = {
        dispatch: noNamespace ? store.dispatch : function (_type, _payload, _options) {
            var args = unifyObjectStyle(_type, _payload, _options);
            var payload = args.payload;
            var options = args.options;
            var type = args.type;
            if (!options || !options.root) {
                type = namespace + type;
                if (process.env.NODE_ENV !== 'production' && !store._actions[type]) {
                    console.error(("[vuex] unknown local action type: " + (args.type) + ", global type: " + type));
                    return;
                }
            }
            return store.dispatch(type, payload);
        },
        commit: noNamespace ? store.commit : function (_type, _payload, _options) {
            var args = unifyObjectStyle(_type, _payload, _options);
            var payload = args.payload;
            var options = args.options;
            var type = args.type;
            if (!options || !options.root) {
                type = namespace + type;
                if (process.env.NODE_ENV !== 'production' && !store._mutations[type]) {
                    console.error(("[vuex] unknown local mutation type: " + (args.type) + ", global type: " + type));
                    return;
                }
            }
            store.commit(type, payload, options);
        }
    };
    // getters and state object must be gotten lazily
    // because they will be changed by vm update
    Object.defineProperties(local, {
        getters: {
            get: noNamespace
                ? function () { return store.getters; }
                : function () { return makeLocalGetters(store, namespace); }
        },
        state: {
            get: function () { return getNestedState(store.state, path); }
        }
    });
    return local;
}
function makeLocalGetters(store, namespace) {
    // if (!store._makeLocalGettersCache[namespace]) {
    // 	const gettersProxy = {}
    // 	const splitPos = namespace.length
    // 	Object.keys(store.getters as object).forEach((type) => {
    // 		// skip if the target getter is not match this namespace
    // 		if (type.slice(0, splitPos) !== namespace) return
    // 		// extract local getter type
    // 		const localType = type.slice(splitPos)
    // 		// Add a port to the getters proxy.
    // 		// Define as getter property because
    // 		// we do not want to evaluate the getters in this time.
    // 		Object.defineProperty(gettersProxy, localType, {
    // 			get: () => (store.getters as any)[type],
    // 			enumerable: true
    // 		})
    // 	})
    // 	store._makeLocalGettersCache[namespace] = gettersProxy
    // }
    return store._makeLocalGettersCache[namespace];
}
function getNestedState(state, path) {
    return path.reduce(function (state, key) { return state[key]; }, state);
}
function unifyObjectStyle(type, payload, options) {
    if (isObject(type) && type.type) {
        options = payload;
        payload = type;
        type = type.type;
    }
    if (process.env.NODE_ENV !== 'production') {
        assert(typeof type === 'string', ("expects string as the type, but found " + (typeof type) + "."));
    }
    return { type: type, payload: payload, options: options };
}
function genericSubscribe(sub, subscribers) {
    var index = subscribers.push(sub);
    return function () {
        subscribers.splice(index - 1, 1);
    };
}
function enableStrictMode(store) {
    store._vm.$watch(function () { return store._vm._data.$$state; }, function () {
        if (process.env.NODE_ENV !== 'production') {
            assert(store._committing, "do not mutate vuex store state outside mutation handlers.");
        }
    }, { deep: true, sync: true });
}
function resetStoreVM(store, state, hot) {
    var oldVm = store._vm;
    // bind store public getters
    store.getters = {};
    // reset local getters cache
    store._makeLocalGettersCache = Object.create(null);
    var wrappedGetters = store._wrappedGetters;
    var computed = {};
    forEachValue(wrappedGetters, function (fn, key) {
        // use computed to leverage its lazy-caching mechanism
        // direct inline function use will lead to closure preserving oldVm.
        // using partial to return function with only arguments preserved in closure environment.
        computed[key] = partial(fn, store);
        Object.defineProperty(store.getters, key, {
            get: function () { return store._vm[key]; },
            enumerable: true // for local getters
        });
    });
    // use a Vue instance to store the state tree
    // suppress warnings just in case the user has added
    // some funky global mixins
    // const silent = Vue.config.silent
    // Vue.config.silent = true
    store._vm = new Vue({
        data: {
            $$state: state
        },
        computed: computed
    });
    // Vue.config.silent = silent
    // enable strict mode for new vm
    if (store.strict) {
        enableStrictMode(store);
    }
    // if (oldVm) {
    // 	if (hot) {
    // 		// dispatch changes in all subscribed watchers
    // 		// to force getter re-evaluation for hot reloading.
    // 		store._withCommit(() => {
    // 			oldVm._data.$$state = null
    // 		})
    // 	}
    // 	Vue.nextTick(() => oldVm.$destroy())
    // }
}

var index = {
    Store: Store,
    install: install
};

exports.default = index;

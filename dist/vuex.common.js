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

var Store = function Store(options) {
    // super(options)
    this._committing = false;
    this.strict = false;
    this._subscribers = [];
    this._actionSubscribers = [];
    options = options || {};
    if (process.env.NODE_ENV !== 'production') {
        // assert(Vue, `must call Vue.use(Vuex) before creating a store instance.`)
        // assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
        assert(this instanceof Store, "store must be called with the new operator.");
    }
    var state = options.state;
    var mutations = options.mutations;
    var actions = options.actions;
    var getters = options.getters;
    var strict = options.strict; if ( strict === void 0 ) strict = false;
    this.state = (typeof state === 'function' ? state() : state) || {};
    this.getters = getters;
    this._mutations = mutations;
    this._actions = actions;
    this._watcherVM = new Vue();
    this.strict = strict;
    install(Vue);
    resetStoreVM(this, state);
};
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
// get state(){
// 	return this.state
// }
// set state(v){
// 	if (process.env.NODE_ENV !== 'production') {
// 		assert(false, `use store.replaceState() to explicit replace store state.`)
// 	}
// }
Store.prototype.subscribe = function subscribe (sub) {
    return genericSubscribe(sub, this._subscribers);
};
Store.prototype.subscribeAction = function subscribeAction (sub) {
    return genericSubscribe(sub, this._actionSubscribers);
};
Store.prototype.commit = function commit (_type, _payload, _options) {
        var this$1 = this;

    var ref = unifyObjectStyle(_type, _payload, _options);
        var type = ref.type;
        var payload = ref.payload;
        var options = ref.options;
    if (options && options.silent) {
        console.warn("[vuex] mutation type: " + type + ". Silent option has been removed. " +
            'Use the filter functionality in the vue-devtools');
    }
    this._subscribers.slice().forEach(function (sub) { return sub({ type: type, payload: payload }, this$1.state); });
    this._withCommit(function () {
        this$1._mutations && this$1._mutations[type](this$1.state, payload);
    });
};
Store.prototype.dispatch = function dispatch (_type, _payload) {
        var this$1 = this;

    var ref = unifyObjectStyle(_type, _payload);
        var type = ref.type;
        var payload = ref.payload;
    var handler;
    if (!this._actions) {
        return promiseError("[vuex]: missing actions");
    }
    var action = this._actions[type];
    if (!action) {
        if (process.env.NODE_ENV !== 'production') {
            return promiseError(("[vuex]: unknow action type: " + type));
        }
    }
    if (typeof action === 'function') {
        handler = action;
    }
    else {
        handler = action.handler;
    }
    this._actionSubscribers.slice().forEach(function (sub) { return sub({ type: type, payload: payload }, this$1.state); });
    var res = handler.call(this, {
        commit: this.commit.bind(this),
        dispatch: this.dispatch.bind(this),
        getters: this.getters,
        state: this.state
    }, payload);
    if (!isPromise(res)) {
        res = Promise.resolve(res);
    }
    if (this._devtoolHook) {
        return res.catch(function (err) {
            this$1._devtoolHook.emit('vuex:error', err);
            throw err;
        });
    }
    else {
        return res;
    }
};
//registerModule<T>(path: string, module: Module<T, S>, options?: ModuleOptions): void;
Store.prototype.registerModule = function registerModule (path, rawModule, options) {

    if (typeof path === 'string')
        { path = [path]; }
    if (process.env.NODE_ENV !== 'production') {
        assert(Array.isArray(path), "module path must be a string or an Array.");
        assert(path.length > 0, 'cannot register the root module by using registerModule.');
    }
    // this._modules.register(path, rawModule)
    // installModule(this, this.state, path, this._modules.get(path), options.preserveState)
    // // reset store to update getters...
    // resetStoreVM(this, this.state)
};
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
function promiseError(msg) {
    console.error(msg);
    return Promise.resolve(msg);
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
function resetStoreVM(store, state) {
    var computed = {};
    function transformGetters(getters, store) {
        if ( getters === void 0 ) getters = {};

        var getterProxy = {};
        Object.keys(getters).map(function (fnName) {
            Object.defineProperty(getterProxy, fnName, {
                get: function get() {
                    return getters[fnName](store.state);
                }
            });
        });
        return getterProxy;
    }
    store._vm = new Vue({
        data: function () {
            return { $$state: state };
        },
        computed: computed
    });
    store.getters = transformGetters(store.getters, store);
    if (store.strict) {
        enableStrictMode(store);
    }
}

var index = {
    Store: Store,
    install: install
};

exports.default = index;

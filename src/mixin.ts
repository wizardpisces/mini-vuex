import _Vue, { ComponentOptions } from 'vue';

export default function (Vue: typeof _Vue) {
    const version = Number(Vue.version.split('.')[0])

    if (version >= 2) {
    /**
* Vuex init hook, injected into each instances init hooks list.
*/
        Vue.mixin({
            beforeCreate: function () {
                const options: ComponentOptions<_Vue> = this.$options;
                // store injection
                if (options.store) {
                    this.$store = typeof options.store === 'function' ?
                        options.store() :
                        options.store
                } else if (options.parent && options.parent.$store) {
                    this.$store = options.parent.$store
                }
            } })
    } else {
        // override init and inject vuex init procedure
        // for 1.x backwards compatibility.
        // const _init = Vue.prototype._init
        // Vue.prototype._init = function (options = {}) {
        //     options.init = options.init
        //         ? [vuexInit].concat(options.init)
        //         : vuexInit
        //     _init.call(this, options)
        // }
    }

   
}
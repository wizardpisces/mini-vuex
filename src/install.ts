import _Vue,{ ComponentOptions} from 'vue';

export default function (Vue: typeof _Vue) {

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
        }
    })

}

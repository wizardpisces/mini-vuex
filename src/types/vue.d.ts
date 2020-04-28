import Vue, { ComponentOptions } from "vue";
import Store from "@/store";

declare module "vue/types/options" {
    interface ComponentOptions<V extends Vue> {
        store?: Store<any> | Function;
    }
}

declare module "vue/types/vue" {
    interface Vue {
        $store: Store<any>;
    }
}

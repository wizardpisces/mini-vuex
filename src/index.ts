import Store, { install } from './store'
import ModuleCollection from './module/module-collection'
import Module from './module/module'
export * from './types';
// import {
  // mapState,
  // mapMutations, 
  // mapGetters, 
  // mapActions, 
  // createNamespacedHelpers
// } from './helpers'

export default {
  Store,
  ModuleCollection,
  Module,
  install
}


export {
  Store,
  install,
  // mapState,
  // mapMutations,
  // mapGetters,
  // mapActions,
  // createNamespacedHelpers
}

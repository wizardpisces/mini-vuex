# Introduction

A source code analyze project created after vuex test cases

## vuex source code basic structure

### Register Module

Construct module tree

```
├── ModuleCollection (_children)
│   ├── Module-A (_children)
│   │   ├── Module-A-A
│   │   │   └── ...
│   ├── Module-B (_children)
│   │   ├── Module-B-A
│   ├── ..
...
```

```js
//Single Module

_raw_module = {
    state,
    getters,
    actions,
    mutations
}
```

### Install Module

1. update rootState
```js
Vue.set(parentState,namespace,newState)
```
2. make Module local context 

Solve subModule inner function and data access
```js
// context structure
{
    dispatch,
    commit,
    getters,
    state
}
```
3. update and wrap root context 

Based on subModule and namespace

```js
// map to submodule
{
    _actions,
    _mutations,
    _wrappedGetters
}
```
4. recursive run step 3 

Based on Registered Module tree

### Reset Store VM 
every time after module changed

1. make store getters computed based on Install Module's step 3
2. make state reactive

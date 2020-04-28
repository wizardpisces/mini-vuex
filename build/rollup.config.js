import replace from 'rollup-plugin-replace'
import typescript from 'rollup-plugin-typescript2'
import buble from 'rollup-plugin-buble'

import {
  terser
} from 'rollup-plugin-terser'
const version = process.env.VERSION || require('../package.json').version
const banner =
  `/**
  * mini-vuex v${version}
  * (c) ${new Date().getFullYear()} wizardpisces
  * @license MIT
  */`
const configs = {
  // umd: {
  //     output: 'dist/index.umd.js',
  //     format: 'umd',
  //     target: 'es5',
  //     env: 'production'
  // },
  // umdMin: {
  //     output: 'dist/index.umd.min.js',
  //     format: 'umd',
  //     target: 'es5',
  //     plugins: {
  //         post: [terser()]
  //     },
  //     env: 'production'
  // },
  // esm: {
  //     output: 'dist/vuex.esm.js',
  //     format: 'esm',
  //     target: 'es2015',
  //     env: 'production',
  //     genDts: true
  // },
  cjs: {
    output: 'dist/vuex.common.js',
    format: 'cjs',
    target: 'es2015',
    genDts: true
  }
}

const externals = [
  'vue'
]

const genTsPlugin = (configOpts) => typescript({
  useTsconfigDeclarationDir: true,
  tsconfigOverride: {
    compilerOptions: {
      target: configOpts.target,
      declaration: configOpts.genDts
    }
  }
})

const genPlugins = (configOpts) => {
  const plugins = []
  if (configOpts.env) {
    plugins.push(replace({
      'process.env.NODE_ENV': JSON.stringify(configOpts.env)
    }))
  }
  plugins.push(replace({
    'process.env.MODULE_FORMAT': JSON.stringify(configOpts.format)
  }))
  if (configOpts.plugins && configOpts.plugins.pre) {
    plugins.push(...configOpts.plugins.pre)
  }
  plugins.push(genTsPlugin(configOpts))

  if (configOpts.plugins && configOpts.plugins.post) {
    plugins.push(...configOpts.plugins.post)
  }
  if (configOpts.transpile !== false) {
    plugins.push(buble())
  }
  return plugins
}

const genConfig = (configOpts) => ({
  input: 'src/index.ts',
  output: {
    banner,
    file: configOpts.output,
    format: configOpts.format,
    name: 'mini-vuex',
    sourcemap: false,
    exports: 'named',
    globals: configOpts.globals,
  },
  external: externals,
  plugins: genPlugins(configOpts)
})

const genAllConfigs = (configs) => (Object.keys(configs).map(key => genConfig(configs[key])))

export default genAllConfigs(configs)

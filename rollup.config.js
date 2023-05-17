import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser';
import replace from '@rollup/plugin-replace'
import json from '@rollup/plugin-json'

import htmlTemplate from 'rollup-plugin-generate-html-template';
import hash from 'rollup-plugin-hash';
import { defineConfig } from 'rollup';
import externalGlobals from "rollup-plugin-external-globals";

import sass from 'rollup-plugin-sass';
import clear from 'rollup-plugin-clear'
// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'docs/',
    entryFileNames: 'bundle.[hash:6].js',
    format: 'iife', // immediately-invoked function expression — suitable for <script> tags
    sourcemap: true,
    generatedCode: 'es5',
  },

  plugins: [clear({
    // required, point out which directories should be clear.
    targets: ['./docs'],
    // optional, whether clear the directores when rollup recompile on --watch mode.
    watch: true, // default: false
  }),
  sass({
    insert: true
  }),
  htmlTemplate({
    template: 'src/template.html',
    target: 'index.html',
  }),
  externalGlobals({
    jquery: "$"
  }),
  replace({
    'preventAssignment': true,
    'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development')
  }),
  resolve({ browser: true, }), // tells Rollup how to find date-fns in node_modules
  commonjs({
    extensions: ['.js', '.ts'],
  }), // converts date-fns to ES modules
  typescript(),
  json(),
  production && terser(), // minify, but only in production
  ]
})

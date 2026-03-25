import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/index.browser.ts',
    output: {
        file: 'dist/index.browser.js',
        format: 'esm',
        sourcemap: true,
        exports: 'named'
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        json(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false,
            tslib: 'tslib'
        })
    ],
    external: [
        'fast-xml-parser',
        'xmllint-wasm'
    ]
};

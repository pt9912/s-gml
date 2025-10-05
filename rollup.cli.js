import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default {
    input: 'src/cli.ts',
    output: {
        file: 'dist/cli.js',
        format: 'esm',
        sourcemap: true
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        json(),
        typescript({
            tsconfig: './tsconfig.cli.json',
            declaration: false
        })
    ],
    external: ['fast-xml-parser', 'xmllint-wasm', 'xsd-validator', 'commander']
};

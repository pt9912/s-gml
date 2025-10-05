import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
    input: 'src/index.ts',
    output: {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named'
    },
    plugins: [
        nodeResolve(),
        commonjs(),
        typescript({
            tsconfig: './tsconfig.json',
            declaration: false,
            tslib: 'tslib'
        })
    ],
    external: ['xml2js', 'xsd-validator', 'commander']
};

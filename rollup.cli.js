import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

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
        typescript({
            tsconfig: './tsconfig.cli.json',
            declaration: false
        })
    ],
    external: ['xml2js', 'xsd-validator', 'commander']
};

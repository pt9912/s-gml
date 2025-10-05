import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: 'dist/index.js',
                format: 'esm',  // ESM-Output
                sourcemap: true
            },
            {
                file: 'dist/index.cjs.js',  // Optional: CommonJS-Fallback
                format: 'cjs',
                sourcemap: true
            }
        ],
        plugins: [typescript({ tsconfig: './tsconfig.json' })]
    },
    {
        input: 'src/index.ts',
        output: [{ file: 'dist/index.d.ts', format: 'esm' }],
        plugins: [dts()]
    }
];

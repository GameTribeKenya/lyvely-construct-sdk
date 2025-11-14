import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default [
  // Browser-friendly UMD build (minified)
  {
    input: 'src/index.ts',
    output: {
      name: 'LyvelySDK',
      file: 'dist/lyvely-game-sdk.js',
      format: 'umd',
      sourcemap: true,
      globals: {}
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist'
      }),
      production && terser({
        compress: {
          drop_console: false,
          passes: 2
        },
        mangle: {
          reserved: ['LyvelySDK']
        }
      })
    ]
  },
  // ES module build
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/lyvely-game-sdk.esm.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      })
    ]
  }
];

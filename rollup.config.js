import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    terser(),
    typescript({
      tsconfig: './tsconfig.json',
      declarationDir: 'dist/types',
    }),
  ],
}

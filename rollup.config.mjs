import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'

export default {
  input: 'src/index.ts',
  plugins: [
    typescript({ tsconfig: 'tsconfig.json', exclude: ['**/workers/**/*'] }),
    json(),
  ],
  output: {
    dir: 'dist',
    format: 'esm',
    banner: '#!/usr/bin/env node',
  },
}

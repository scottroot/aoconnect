import * as esbuild from 'esbuild';
import esbuildPluginTsc from 'esbuild-plugin-tsc';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const manifest = JSON.parse(readFileSync('package.json'))

function allDepsExcept(excluded) {
  return Object.keys(manifest.dependencies).filter((dep) => !excluded.includes(dep));
}

// CJS
await esbuild.build({
  entryPoints: ['src/index.ts'],
  platform: 'node',
  format: 'cjs',
  external: allDepsExcept(["@permaweb/ao-scheduler-utils"]),
  bundle: true,
  minify: true,
  plugins: [
    esbuildPluginTsc({
      // tsconfigPath: "config/cjs.tsconfig.json",
      force: true
    }),
  ],
  // tsconfig: "config/cjs.tsconfig.json",
  tsconfigRaw: {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "module": "commonjs",
      // "module": "NodeNext",
      "moduleResolution": "node",
      "outDir": "./dist/cjs"
    }
  },
  outfile: manifest.exports['.'].require
});

// ESM
await esbuild.build({
  entryPoints: ['src/index.ts'],
  platform: 'node',
  format: 'esm',
  external: allDepsExcept(["@permaweb/ao-scheduler-utils"]),
  bundle: true,
  minify: true,
  plugins: [
    esbuildPluginTsc({
      force: true
    }),
  ],
  tsconfigRaw: {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "module": "NodeNext",
      "moduleResolution": "NodeNext"
    }
  },
  outfile: manifest.exports['.'].import
})

// Browser ESM
await esbuild.build({
  entryPoints: ['src/index.browser.ts'],
  platform: 'browser',
  format: 'esm',
  sourcemap: true,
  bundle: true,
  minify: true,
  plugins: [
    esbuildPluginTsc({
      force: true
    }),
  ],
  alias: {
    crypto: path.resolve(__dirname, 'node_modules/crypto-browserify'),
    path: path.resolve(__dirname, 'node_modules/path-browserify')
  },
  tsconfigRaw: {
    "compilerOptions": {
      "target": "es5",
      "module": "esnext",
      "lib": ["esnext"],
      "declaration": true,
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "forceConsistentCasingInFileNames": true,
      "moduleResolution": "node",
      "resolveJsonModule": true,
      "skipLibCheck": true,
      "allowSyntheticDefaultImports": true
    },
    "include": ["src"],
    "exclude": ["node_modules", "dist"]
  },
  outfile: manifest.exports['.'].browser
})

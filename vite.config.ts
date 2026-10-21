import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

const assetVersion = '1.1.1021';

function versionBuiltAssets(): Plugin {
  return {
    name: 'version-built-assets',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') continue;

        output.code = output.code.replace(
          /(["'])((?:\.\/|\/)?[^"']+\.css)(?:\?[^"']*)?\1/g,
          (_match, quote: string, asset: string) => `${quote}${asset}?v=${assetVersion}${quote}`,
        );
      }

    },
  };
}

export default defineConfig(() => {
  return {
    define: {
      __APP_VERSION__: JSON.stringify(assetVersion),
    },
    plugins: [
      react(),
      tailwindcss(),
      versionBuiltAssets(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

import vue from "@vitejs/plugin-vue";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigEnv, defineConfig, loadEnv } from "vite";
import { TDesignResolver } from "@tdesign-vue-next/auto-import-resolver";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const version = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf-8")
).version.trim();

const alias: Record<string, string> = {
  "@": resolve(projectRoot, "src"),
  vue: "vue/dist/vue.esm-bundler.js",
};

const htmlPlugin = () => {
  return {
    name: "html-transform",
    transformIndexHtml(html: string) {
      return html.replace(/__SUB_STORE_FRONT_END_VERSION__/g, version);
    },
  };
};

const viteConfig = defineConfig((mode: ConfigEnv) => {
  const env = loadEnv(mode.mode, projectRoot);

  return {
    plugins: [
      htmlPlugin(),
      vue(),
      AutoImport({
        dts: false,
        resolvers: [TDesignResolver({ library: "vue-next" })],
      }),
      Components({
        dts: false,
        resolvers: [TDesignResolver({ library: "vue-next" })],
      }),
    ],
    root: projectRoot,
    resolve: { alias },
    base: mode.command === "serve" ? "./" : env.VITE_PUBLIC_PATH,
    hmr: true,
    server: {
      port: env.VITE_PORT as unknown as number,
      open: env.VITE_OPEN,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      assetsInlineLimit: 2048,
      chunkSizeWarningLimit: 2048,
      target: "es2015",
      minify: "terser",
      input: {
        main: "src/main.ts",
      },
      rollupOptions: {
        output: {
          onlyExplicitManualChunks: true,
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: (assetInfo) => {
            const ext = assetInfo.name?.split('.').pop()?.toLowerCase() ?? '';
            if (/^(png|jpe?g|svg|webp|avif|gif|ico)$/.test(ext)) return 'images/[name].[ext]';
            if (/^(woff2?|ttf|eot|otf)$/.test(ext)) return 'fonts/[name].[ext]';
            if (ext === 'css') return 'css/[name].[ext]';
            return '[name].[ext]';
          },
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('tdesign-icons-vue-next')) return 'tdesign';
              if (id.includes('tdesign-vue-next')) return 'tdesign';
              if (
                id.includes('/codemirror/') ||
                id.includes('@codemirror/') ||
                id.includes('@lezer/') ||
                id.includes('@replit/codemirror') ||
                id.includes('js-beautify')
              ) return 'editor';
              if (id.includes('vue-i18n') || id.includes('@intlify/')) return 'i18n';
              if (id.includes('/vue/') || id.includes('/vue-router/') || id.includes('/pinia/') || id.includes('@vue/') || id.includes('@vueuse/')) return 'vue-vendor';
            }
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/assets/styles/custom_variables.scss";@import '@/assets/styles/mixins.scss';`,
          silenceDeprecations: ["import"],
        },
      },
    },
    define: {
      __VUE_I18N_FULL_INSTALL__: true,
      __VUE_I18N_LEGACY_API__: false,
      __INTLIFY_PROD_DEVTOOLS__: false,
      "import.meta.env.PACKAGE_VERSION": JSON.stringify(version),
    },
  };
});

export default viteConfig;

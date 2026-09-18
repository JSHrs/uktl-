// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Workers bundle via Nitro's cloudflare-module preset. deployConfig is off so
  // Wrangler reads wrangler.toml (with its named environments) directly.
  nitro: { cloudflare: { deployConfig: false } },
  vite: {
    build: {
      rollupOptions: {
        // Only resolvable inside workerd; getEnv() catches the failed import elsewhere.
        external: ["cloudflare:workers"],
      },
    },
  },
});

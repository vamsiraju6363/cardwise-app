import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitest configuration for CardWise.
 *
 * Plugin note:
 *   @vitejs/plugin-react (and -swc) trigger Vite's module-graph scanning on
 *   macOS, causing startup hangs in background worker processes. JSX is handled
 *   instead via esbuild's built-in "automatic" runtime below — identical output,
 *   no scanning overhead.
 *
 * Environment note:
 *   jsdom v24+ has a known hang on macOS due to native DNS/socket initialisation.
 *   happy-dom is a spec-compatible drop-in that provides the same DOM APIs and
 *   works correctly with @testing-library/jest-dom matchers.
 */
export default defineConfig({
  // Disable Vite's file-system watcher — not needed for one-shot `vitest run`
  // and can cause the server to hang waiting for fsevents on macOS.
  server: {
    watch: null,
  },

  // Prevent Vite from scanning node_modules during test runs.
  optimizeDeps: {
    noDiscovery: true,
    include: [],
  },

  test: {
    globals: true,

    // Loads @testing-library/jest-dom matchers (toBeInTheDocument, etc.)
    setupFiles: ["./src/test/setup.ts"],

    include: ["src/test/**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],

    watch: false,

    // vmForks: each test file runs in its own isolated VM context, preventing
    // module-level state from leaking between files.
    pool: "vmForks",
    poolOptions: {
      vmForks: {
        singleFork: true,
      },
    },

    // Per-file environment:
    //   • Pure TS service/utility tests → node  (no DOM needed, fastest)
    //   • React component tests         → happy-dom
    environmentMatchGlobs: [
      ["src/test/ranking.service.test.ts", "node"],
      ["src/test/utils.test.ts", "node"],
      ["src/test/**/*.test.tsx", "happy-dom"],
    ],

    testTimeout: 30000,
    hookTimeout: 30000,
  },

  resolve: {
    alias: {
      // "@/..." resolves to "src/..."
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // JSX transform via esbuild's built-in automatic runtime.
  // This is equivalent to @vitejs/plugin-react for test purposes.
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
});

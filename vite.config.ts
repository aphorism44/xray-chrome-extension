import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig(({ mode }) => {
  if (mode === "content") {
    return {
      build: {
        emptyOutDir: true,
        copyPublicDir: true,

        lib: {
          entry: resolve(
            __dirname,
            "src/content/content-script.ts"
          ),
          name: "XRayContentScript",
          formats: ["iife"],
          fileName: () =>
            "content/content-script.js"
        }
      }
    };
  }

  if (mode === "background") {
    return {
      build: {
        emptyOutDir: false,
        copyPublicDir: false,

        lib: {
          entry: resolve(
            __dirname,
            "src/background/service-worker.ts"
          ),
          formats: ["es"],
          fileName: () =>
            "background/service-worker.js"
        }
      }
    };
  }

  if (mode === "sidepanel") {
    return {
      build: {
        emptyOutDir: false,
        copyPublicDir: false,

        lib: {
          entry: resolve(
            __dirname,
            "src/sidepanel/sidepanel.ts"
          ),
          formats: ["es"],
          fileName: () =>
            "sidepanel/sidepanel.js"
        }
      }
    };
  }

  if (mode === "settings") {
    return {
      build: {
        emptyOutDir: false,
        copyPublicDir: false,

        lib: {
          entry: resolve(
            __dirname,
            "src/settings/settings.ts"
          ),
          formats: ["es"],
          fileName: () =>
            "settings/settings.js"
        }
      }
    };
  }

  throw new Error(`Unknown build mode: ${mode}`);
});
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  // Pull VITE_* vars from environments/.env.<mode> first, then root .env files.
  const env = loadEnv(mode, path.resolve(__dirname, "environments"), "VITE_");
  return {
    plugins: [react(), tailwindcss()],
    envDir: path.resolve(__dirname, "environments"),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      port: 5180,
      host: true,
    },
    define: {
      // Expose env vars explicitly so they're available even when envDir lookup misses
      ...Object.fromEntries(
        Object.entries(env).map(([k, v]) => [`import.meta.env.${k}`, JSON.stringify(v)])
      ),
    },
  };
});

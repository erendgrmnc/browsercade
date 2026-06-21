import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Served at "/arcade" in production (path-mounted under the portfolio via a
// Vercel rewrite); root "/" in local dev.
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/arcade/" : "/",
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
}));

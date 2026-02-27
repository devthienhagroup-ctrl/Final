// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const enableFileWatch = process.env.VITE_ENABLE_WATCH === "true";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5176,
    watch: enableFileWatch
      ? {
          usePolling: true,
          interval: 1000,
          binaryInterval: 1500,
          ignorePermissionErrors: true,
        }
      : null,
  },
});

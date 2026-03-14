// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],

  server: {
    host: "0.0.0.0",
    port: 5181,
    strictPort: true,

    allowedHosts: [
      "demo.ayanavita.com",
      "manage.ayanavita.com",
      "student.ayanavita.com",
      "lecturer.ayanavita.com"
    ]
  }
});
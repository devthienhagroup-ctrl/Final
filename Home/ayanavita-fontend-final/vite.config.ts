// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";


export default defineConfig({
    plugins: [
        react()
    ],

    server: {
        host: "0.0.0.0",
        port: 5176,
        strictPort: true,

        allowedHosts: [
            "demo.ayanavita.com",
            "manage.ayanavita.com",
            "student.ayanavita.com",
            "lecturer.ayanavita.com"
        ]
    }
});
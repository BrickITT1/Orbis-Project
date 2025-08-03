import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import tailwindcss from '@tailwindcss/vite'


const socketServerUrl =
    process.env.VITE_MEDIA_SERVICE_SERVER_URL || "https://26.234.138.233:3007";

export default defineConfig({
    plugins: [tailwindcss(), react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        watch: {
            usePolling: true,  // помогает в Docker для отслеживания файлов
        },
        https: {
            key: fs.readFileSync(
                path.resolve(__dirname, "ssl/selfsigned_key.pem"),
            ),
            cert: fs.readFileSync(
                path.resolve(__dirname, "ssl/selfsigned.pem"),
            ),
        },
        proxy: {
            "/socket.io": {
                target: socketServerUrl, // Ваш бэкенд
                ws: true, // Проксировать WebSocket
                changeOrigin: true,
                secure: false, // Отключить проверку SSL для самоподписанных сертификатов
            },
        },
    },
    build: {
        sourcemap: true,
        emptyOutDir: true,
    },
    css: {
        preprocessorOptions: {
            sass: {
                api: "legacy-compiler",
            },
            scss: {},
        },
    },
    define: {
        "process.env": process.env,
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        }
    }
});

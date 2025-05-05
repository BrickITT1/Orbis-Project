/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SOCKET_SERVER_URL: string;
    readonly VITE_AUTH_SERVICE_SERVER_URL: string;
    readonly VITE_CHAT_SERVICE_SERVER_URL: string;
    readonly VITE_MEDIA_SERVICE_SERVER_URL: string;
    readonly VITE_CDN_SERVICE_SERVER_URL: string;
    readonly VITE_USER_SERVICE_SERVER_URL: string;
    readonly VITE_NOTIFICATION_SERVICE_SERVER_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

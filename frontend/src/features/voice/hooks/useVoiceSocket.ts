import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { config } from "@/config";
import { useRefreshTokenQueryQuery } from "@/features/auth";

export const useVoiceSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { data: tokenData, isSuccess } = useRefreshTokenQueryQuery({});

    useEffect(() => {
        if (!isSuccess || !tokenData) return;

        // Создаем новый сокет только если его еще нет
        if (!socketRef.current) {
            const newSocket = io(config.mediaServiceUrl, {
                auth: { token: tokenData.access_token },
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
            });

            newSocket.on("connect", () => {
                console.log("[VoiceSocket] Connected");
                setIsConnected(true);
            });

            newSocket.on("disconnect", () => {
                console.log("[VoiceSocket] Disconnected");
                setIsConnected(false);
            });

            newSocket.on("connect_error", (err) => {
                console.error("[VoiceSocket] Connection error:", err);
                setIsConnected(false);
            });

            socketRef.current = newSocket;
        }

        return () => {
            // Очищаем только если компонент полностью размонтируется
            // socketRef.current?.disconnect();
            // socketRef.current = null;
        };
    }, [isSuccess, tokenData]);

    return {
        socket: socketRef.current,
        isConnected,
    };
};

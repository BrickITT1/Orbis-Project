import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRefreshTokenQueryQuery } from "../../../services/auth";
import { config } from "../../../config";

export const useServerJournalSocket = () => {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const { data: tokenData, isSuccess } = useRefreshTokenQueryQuery({});
    

    useEffect(() => {
        if (!isSuccess || !tokenData) return;

        // Создаем новый сокет только если его еще нет
        if (!socketRef.current) {
            const newSocket = io(config.userServiceUrl, {
                auth: { token: tokenData.access_token },
                autoConnect: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 3000,
            });

            newSocket.on("connect", () => {
                console.log("[JournalSocket] Connected");
                setIsConnected(true);
            });

            newSocket.on("disconnect", () => {
                console.log("[JournalSocket] Disconnected");
                setIsConnected(false);
            });

            newSocket.on("connect_error", (err) => {
                console.error("[JournalSocket] Connection error:", err);
                setIsConnected(false);
            });

            socketRef.current = newSocket;
            
        }
    }, [isSuccess, tokenData]);

    return {
        socket: socketRef.current,
        isConnected,
    };
};

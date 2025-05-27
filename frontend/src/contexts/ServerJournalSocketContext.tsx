import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";
import { useServerJournalSocket } from "../app/hook/serverjournal/useServerJournalSocket";

interface ServerJournalSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    signal?: any;
}

const ServerJournalSocketContext = createContext<ServerJournalSocketContextType>({
    socket: null,
    isConnected: false,
});

export const ServerJournalProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const { socket, isConnected } = useServerJournalSocket();

    // Добавляем задержку для показа "Connecting..."
    const [showConnecting, setShowConnecting] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setShowConnecting(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <ServerJournalSocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </ServerJournalSocketContext.Provider>
    );
};

export const useServerJournalContext = () => {
    const context = useContext(ServerJournalSocketContext);
    if (!context) {
        throw new Error(
            "useVoiceSocketContext must be used within a VoiceSocketProvider",
        );
    }
    return context;
};

import { useChatSocket } from "@/features/chat";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Socket } from "socket.io-client";

interface TextChatSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    localVideoRef?: { current: MediaStream | null };
    audioStreams?: Record<string, MediaStream>;
    videoStreams?: Record<string, MediaStream>;
}

const TextChatSocketContext = createContext<TextChatSocketContextType>({
    socket: null,
    isConnected: false,
});

export const TextChatSocketProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const { socket, isConnected } = useChatSocket();

    // Добавляем задержку для показа "Connecting..."
    const [showConnecting, setShowConnecting] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setShowConnecting(false), 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <TextChatSocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </TextChatSocketContext.Provider>
    );
};

export const useVoiceSocketContext = () => {
    const context = useContext(TextChatSocketContext);
    if (!context) {
        throw new Error(
            "useVoiceSocketContext must be used within a VoiceSocketProvider",
        );
    }
    return context;
};

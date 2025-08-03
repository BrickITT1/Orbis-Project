import { useState, useEffect, useCallback, useMemo } from "react";
import { useChatSocket } from "./useChatSocket";
import { useAppSelector } from "../../../app/hooks";
import { Message } from "../types/chat.types";
import { useLazyGetMessagesQuery } from "../api/chatApi";


export const useChatMessages = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const { socket } = useChatSocket();
    const activeChat = useAppSelector(s => s.chat.activeChat);
    const activeServer = useAppSelector(s => s.server.activeserver)
    const [getMesseges] = useLazyGetMessagesQuery();
    
    // Группировка сообщений
    const groupedMessages = useMemo(() => {
        if (messages.length === 0) return null;
        return groupMessagesByMinuteAndUserId(messages);
    }, [messages]);

    // Подключение к комнате
    useEffect(() => {
        if (!socket) return
        if (!activeChat?.chat_id) return

        socket.emit("join-chat", activeChat?.chat_id);
        
    }, [activeChat?.chat_id, socket]);

    // Обработчики сокетов
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = () => {
            setTimeout(()=>{
                getMesseges(activeChat?.chat_id);
            }, 3000)
        };

        const handleMessageHistory = (history: Message[]) => {
            //setMessages(history);
        };

        const handleConnect = () => setIsSocketConnected(true);
        const handleDisconnect = () => setIsSocketConnected(false);

        socket.on("new-message", handleNewMessage);
        socket.on("message-history", handleMessageHistory);
        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        return () => {
            socket.off("new-message", handleNewMessage);
            socket.off("message-history", handleMessageHistory);
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
        };
    }, [socket, activeChat?.chat_id]);
    // Отправка сообщения
    

    return {
        messages,
        groupedMessages,
        isSocketConnected,
    };
};

// Вспомогательная функция для группировки
const groupMessagesByMinuteAndUserId = (
    messages: Message[],
): {
    messages: Message[];
    user_id: number;
    username: string;
    minute: string;
}[] => {
    const groupedMessages: {
        user_id: number;
        messages: Message[];
        username: string;
        minute: string;
    }[] = [];
    let currentGroup: {
        user_id: number;
        messages: Message[];
        username: string;
        minute: string;
    } | null = null;

    messages.forEach((message) => {
        const minuteKey = message.timestamp.substring(0, 5); // Получаем 'HH:mm'
        // Если текущая группа пуста, или пользователь изменился, или минута изменилась, создаем новую группу
        if (
            !currentGroup ||
            currentGroup.user_id !== message.user_id ||
            currentGroup.minute !== minuteKey
        ) {
            currentGroup = {
                user_id: message.user_id,
                messages: [],
                minute: minuteKey,
                username: message.username,
            };
            groupedMessages.push(currentGroup);
        }
        // Добавляем сообщение в текущую группу
        currentGroup.messages.push(message);
    });

    // Возвращаем массив объектов с сообщениями, user_id и минутой
    return groupedMessages.map((group) => {
        return {
            messages: group.messages,
            user_id: group.user_id,
            minute: group.minute, // Используем минуту из группы
            username: group.username,
        };
    });
};

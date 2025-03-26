import { useState, useEffect, useCallback, useMemo } from 'react';
import  useChatSocket from './useChatSocket';

interface Message {
    id: number,
    content: string,
    user_id: number,
    is_edited: boolean,
    timestamp: string,
  }

export const useChatMessages = (activeChatId: string | undefined, token: string | undefined) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const socket = useChatSocket();

  // Группировка сообщений
  const groupedMessages = useMemo(() => {
    if (messages.length === 0) return null;
    return groupMessagesByMinuteAndUserId(messages);
  }, [messages]);

  // Подключение к комнате
  useEffect(() => {
    if (socket && activeChatId) {
      socket.emit('join-room', activeChatId);
    }
  }, [activeChatId, socket]);

  // Обработчики сокетов
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      setMessages(prev => [...prev, message]);
    };

    const handleMessageHistory = (history: Message[]) => {
      setMessages(history);
    };

    const handleConnect = () => setIsSocketConnected(true);
    const handleDisconnect = () => setIsSocketConnected(false);

    socket.on('new-message', handleNewMessage);
    socket.on('message-history', handleMessageHistory);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('new-message', handleNewMessage);
      socket.off('message-history', handleMessageHistory);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [socket]);

  // Отправка сообщения
  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !activeChatId || !token || !socket?.connected) return;

    try {
      socket.emit('send-message', {
        room: activeChatId,
        user_id: token,
        text: newMessage,
      });
      setNewMessage('');
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
    }
  }, [newMessage, activeChatId, token, socket]);

  return {
    messages,
    groupedMessages,
    newMessage,
    setNewMessage,
    sendMessage,
    isSocketConnected,
  };
};

// Вспомогательная функция для группировки
const groupMessagesByMinuteAndUserId = (messages: Message[]): { messages: Message[]; user_id: number; minute: string }[] => {
    const groupedMessages: { user_id: number; messages: Message[]; minute: string }[] = [];
    let currentGroup: { user_id: number; messages: Message[]; minute: string } | null = null;
  
    messages.forEach(message => {
      const minuteKey = message.timestamp.substring(0, 5); // Получаем 'HH:mm'
  
      // Если текущая группа пуста, или пользователь изменился, или минута изменилась, создаем новую группу
      if (!currentGroup || currentGroup.user_id !== message.user_id || currentGroup.minute !== minuteKey) {
        currentGroup = { user_id: message.user_id, messages: [], minute: minuteKey };
        groupedMessages.push(currentGroup);
      }
  
      // Добавляем сообщение в текущую группу
      currentGroup.messages.push(message);
    });
  
    // Возвращаем массив объектов с сообщениями, user_id и минутой
    return groupedMessages.map(group => {
      return {
        messages: group.messages,
        user_id: group.user_id,
        minute: group.minute // Используем минуту из группы
      };
    });
  };
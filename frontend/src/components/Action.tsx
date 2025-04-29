import React, { useEffect, useRef } from 'react';
import { useAppSelector, useAppDispatch } from '../app/hooks';
import { setJoin } from '../features/voice/voiceSlices'; // Например, для управления состоянием чата
import { VoiceRoomChat } from './Voice/VoiceRoomChat';
import { Message } from '../types/Message';
import { HistoryChat } from './Chat/HistoryChat';
import { InputChat } from './Chat/InputChat';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <div className="error-fallback">Произошла ошибка в чате</div>;
    }
    return this.props.children;
  }
}

interface ActionProps {
  handleSendMessage: (newMessage: string) => void;
  joinRoomApi: (roomId: number, attempt?: number) => Promise<boolean>
  Messages: {
    messages: Message[];
    user_id: number;
    user_name: string;
    minute: string;
}[] | null;
videoStreams: Record<string, MediaStream>

}

export const Action: React.FC<ActionProps> = ({
  joinRoomApi,
  handleSendMessage,
  Messages,
  videoStreams
}) => {
  const activeChat = useAppSelector(state => state.chat.activeChat);
  const activeServer = useAppSelector(state => state.server.activeserver);
  const token = useAppSelector(state => state.auth.user?.access_token);
  const voiceState = useAppSelector(state => state.voice);
  const MyUsername = useAppSelector(state => state.auth.user?.username);

  const messagesDivRef = useRef<HTMLDivElement>(null);


  const joinRoom = async (roomId: number, attempt = 1) => {
    try {
      // Логика подключения к комнате, например, через сокет
      const success = await joinRoomApi(roomId); // Здесь joinRoomApi - это твоя функция подключения
      
    } catch (error) {
      console.error("Error while joining room:", error);
      if (attempt < 3) {
        setTimeout(() => joinRoom(roomId, attempt + 1), 2000); // Повторить попытку подключения
      }
    }
  };

  return (
    <ErrorBoundary>
      {activeChat ? (
        <div className="actions">
          <div className="actions-main">
            {/* Заголовок чата */}
            <div className="chat-title">
              <div className="title">{activeChat.name || 'Чат'}</div>
              <div className="buttons">
                {!activeServer && (
                  <button
                    className="voice"
                    onClick={() => {
                      try {
                        joinRoom(activeChat.id);
                      } catch (err) {
                        console.error('Join room error:', err);
                      }
                    }}
                    disabled={voiceState.isConnected}
                  >
                    {/* SVG-иконка */}
                    🎤
                  </button>
                )}
              </div>
            </div>

            {/* Компонент голосового чата, если пользователь подключен */}
            {voiceState.isConnected && (<VoiceRoomChat videoStreams={videoStreams}/>)} 
                
            {/* История чатов */}
            <HistoryChat groupMessage={Messages} />

            {/* Ввод нового сообщения */}
            <InputChat handleSendMessage={handleSendMessage} />
          </div>
        </div>
      ) : (
        <div className="actions" />
      )}
    </ErrorBoundary>
  );
};

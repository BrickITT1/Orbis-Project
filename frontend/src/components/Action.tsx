import React, { useEffect, useRef } from 'react';
import { useAppSelector } from '../app/hooks';

import { VoiceRoomChat } from './Voice/VoiceRoomChat';

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
  joinRoom: (roomId: number, attempt?: number) => Promise<boolean>;
  localVideo: React.RefObject<HTMLVideoElement>
}

export const Action: React.FC<ActionProps> = ({
  joinRoom,
  localVideo
}) => {
  const activeChat = useAppSelector(state => state.chat.activeChat);
  const activeServer = useAppSelector(state => state.server.activeserver);
  const token = useAppSelector(state => state.auth.user?.access_token);
  const voiceState = useAppSelector(state => state.voice);
  const MyUsername = useAppSelector(state => state.auth.user?.username);

  

  const messagesDivRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (messagesDivRef.current) {
      messagesDivRef.current.scrollTop = messagesDivRef.current.scrollHeight;
    }
  };

  // Подключаем/отключаем socket.io чат
  

  // Enter → отправка
  // useEffect(() => {
  //   const onKey = (e: KeyboardEvent) => {
  //     if (e.key === 'Enter' && newMessage.trim()) {
  //       sendMessage();
  //       scrollToBottom();
  //     }
  //   };
  //   inputRef.current?.addEventListener('keydown', onKey);
  //   return () => {
  //     inputRef.current?.removeEventListener('keydown', onKey);
  //   };
  // }, [newMessage, sendMessage]);

  // // Скролл при новых сообщениях
  // useEffect(scrollToBottom, [messages]);

  // Как только залогинены в голосовую (voiceState.joined), сразу joinRoom
  useEffect(() => {
    if (voiceState.joined && activeChat?.id) {
      joinRoom(activeChat.id);
    }
  }, [voiceState.joined, activeChat?.id, joinRoom]);

  // const handleSendMessage = () => {
  //   if (newMessage.trim()) {
  //     sendMessage();
  //     scrollToBottom();
  //   }
  // };

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
                    disabled={voiceState.joined}
                  >
                    {/* SVG-иконка */}
                    🎤
                  </button>
                )}
              </div>
            </div>
            {voiceState.joined && (<VoiceRoomChat />)} 
                
            

            {/* Список сообщений */}
            {/* <div className="messages" ref={messagesDivRef}>
              {groupedMessages?.map((group, idx) =>
                group.messages.length === 1 ? (
                  <SingleMessage
                    key={`single-${group.messages[0].id}-${idx}`}
                    message={group.messages[0]}
                  />
                ) : (
                  <MessageGroup
                    key={`group-${group.user_id}-${group.minute}-${idx}`}
                    group={group}
                  />
                )
              )}
            </div> */}

            {/* Ввод сообщения */}
            {/* <div className="chat-input">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
              />
              <button onClick={handleSendMessage} className="enter-message">
                Отправить
              </button>
            </div> */}
          </div>
        </div>
      ) : (
        <div className="actions" />
      )}
    </ErrorBoundary>
  );
};

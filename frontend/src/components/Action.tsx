import React, { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { setToggleJoin } from "../features/voice/voiceSlices"; // Например, для управления состоянием чата
import { VoiceRoomChat } from "./Voice/VoiceRoomChat";
import { Message } from "../types/Message";
import { HistoryChat } from "./Chat/HistoryChat";
import { InputChat } from "./Chat/InputChat";
import { setActiveChat } from "../features/chat/chatSlices";
import { useLazyGetChatInfoQuery } from "../services/chat";

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
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
    
    Messages:
        | {
              messages: Message[];
              user_id: number;
              user_name: string;
              minute: string;
          }[]
        | null;
    videoStreams: Record<string, MediaStream>;
}

export const Action: React.FC<ActionProps> = ({
    
    handleSendMessage,
    Messages,
    videoStreams
}) => {
    const dispatch = useAppDispatch();
    const activeChat = useAppSelector(state => state.chat.activeChat);
    const activeServer = useAppSelector(state => state.server.activeserver);
    const token = useAppSelector(state => state.auth.user?.access_token);
    const voiceState = useAppSelector(state => state.voice);
    const MyUsername = useAppSelector(state => state.auth.user?.username);

    const messagesDivRef = useRef<HTMLDivElement>(null);


    const joinVoiceRoom = () => {
        if (!activeChat) return
        dispatch(setToggleJoin({isConnected: true, roomId: activeChat?.id}))
    }

    const [trigger, { data, isFetching, error }] = useLazyGetChatInfoQuery();

    useEffect(() => {
        if (!activeServer) return;
        if (activeServer && activeServer.chats[0]) {
            trigger(activeServer.chats[0]);
        }
        if (!activeServer?.chats[0]) {
            dispatch(setActiveChat(undefined))
        }
    }, [activeServer])

    useEffect(()=> {
        if (data) {
            dispatch(setActiveChat(data[0]))
        }
    }, [data])

    

    return (
        <ErrorBoundary>
            {activeChat && <div className="actions">
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
                                                joinVoiceRoom();
                                            } catch (err) {
                                                console.error('Join room error:', err);
                                            }
                                        }}
                                        disabled={voiceState.isConnected}
                                    >
                                        {/* SVG-иконка */}
                      <svg width="31" height="30" viewBox="0 0 31 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.0425 7.79193C12.7779 6.90975 12.5916 5.99362 12.4917 5.05175C12.3935 4.126 11.5861 3.43762 10.6552 3.43762H6.33692C5.22648 3.43762 4.37105 4.39668 4.4688 5.50281C5.45342 16.6456 14.3295 25.5217 25.4723 26.5063C26.5784 26.6041 27.5375 25.7517 27.5375 24.6414V20.7917C27.5375 19.3862 26.849 18.5816 25.9234 18.4834C24.9815 18.3836 24.0654 18.1972 23.1832 17.9326C22.104 17.6089 20.9359 17.9136 20.1392 18.7102L18.2913 20.5581C14.9625 18.7566 12.2185 16.0126 10.417 12.6838L12.2649 10.8359C13.0615 10.0392 13.3662 8.871 13.0425 7.79193Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>

                  </button>
                                )}
                            </div>
                        </div>

                        {/* Компонент голосового чата, если пользователь подключен */}
                        {voiceState.isConnected && voiceState.roomId == activeChat.id && (<VoiceRoomChat videoStreams={videoStreams}/>)} 
                        
                        {/* История чатов */}
                        <HistoryChat groupMessage={Messages} />

                        {/* Ввод нового сообщения */}
                        <InputChat handleSendMessage={handleSendMessage} />
                    </div>
                </div>}
                      
            
        </ErrorBoundary>
    );
};

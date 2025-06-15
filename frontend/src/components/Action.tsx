import React, { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { setAudioOnlyMyPeer, setChat, setToggleJoin } from "../features/voice/voiceSlices";
import { VoiceRoomChat } from "./Voice/VoiceRoomChat";
import { HistoryChat } from "./Chat/HistoryChat";
import { InputChat } from "./Chat/InputChat";
import { useJoinVoiceRoom, useConnectToVoiceRoom, useLeaveRoom } from "../app/socket/voice/voiceAction";
import { useLazyGetPeersInRoomQuery } from "../services/voice";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    state = { hasError: false };
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error("ErrorBoundary caught:", error, info);
    }
    render() {
        if (this.state.hasError) {
            return <div className="error-fallback">Произошла ошибка в чате</div>;
        }
        return this.props.children;
    }
}

export const Action: React.FC = () => {
    const dispatch = useAppDispatch();
    const activeChat = useAppSelector(state => state.chat.activeChat);
    const activeServer = useAppSelector(state => state.server.activeserver);
    const voiceState = useAppSelector(state => state.voice);
    const bigMode = useAppSelector(s => s.voice.bigMode);
    const authInfo = useAppSelector(s => s.auth.user?.info)
    const isConnection = useAppSelector(s => s.voice.isConnected);
    const join = useJoinVoiceRoom();
    const connectStatus = useConnectToVoiceRoom();
    const leaveStatus = useLeaveRoom();

    const [getPeers, {data, isSuccess}] = useLazyGetPeersInRoomQuery();
    const roomPeers = useAppSelector((s) => s.voice.roomPeers);
    
    useEffect(()=> {
        if (activeServer) return
        if (!activeChat) return
        
        getPeers(`ls-${activeChat?.chat_id}`);
    }, [activeChat, ])

    useEffect(() => {
        if (!voiceState.roomId) return;
        getPeers(voiceState.roomId);
    }, [voiceState.roomId]);


    const bottomRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const joinVoiceRoom = async () => {
        if (!activeChat || !authInfo) return;

        const roomId = `ls-${activeChat.chat_id}`;
        const success = join(roomId); // вызов useJoinVoiceRoom

        if (!success) {
            console.error("Не удалось инициировать данные для подключения к голосовой комнате");
            return;
        }

        // Хук useConnectToVoiceRoom выполнит подключение сам (у тебя он срабатывает по useEffect)
        //dispatch(setToggleJoin({ isConnected: true, roomId: String(activeChat.chat_id) }));

    };



    return (
        <ErrorBoundary>
            {!(bigMode && isConnection) && <>
                {activeChat && (
                <div className="actions">
                    <div className="actions-main">
                        <div className="chat-title">
                            <div className="title">
                                {activeServer ? activeChat.name : activeChat.username} { roomPeers.length > 0 && <span>Активный звонок {roomPeers.length}</span>}
                            </div>
                            <div className="buttons">
                                {!activeServer && (
                                    <button
                                        className="voice"
                                        onClick={joinVoiceRoom}
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

                        
                        {activeChat && voiceState.isConnected && voiceState.roomId === `ls-${activeChat.chat_id}`  &&  <VoiceRoomChat/>}
                        

                        {/* История чатов с ref */}
                        <HistoryChat bottomRef={bottomRef} />

                        {/* Ввод нового сообщения с scrollToBottom */}
                        <InputChat scrollToBottom={scrollToBottom} />
                    </div>
                </div>
            )}
            </>}
            
        </ErrorBoundary>
    );
};

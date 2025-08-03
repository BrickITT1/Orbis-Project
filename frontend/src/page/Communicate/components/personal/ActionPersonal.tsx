import React, { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { setStatus, useConnectToVoiceRoom, useJoinVoiceRoom, useLazyGetPeersInRoomQuery, useLeaveRoom, VoiceComponets } from "@/features/voice";
import { HistoryChat, InputChat } from "@/features/chat";
import { Phone } from "lucide-react";

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
    const authInfo = useAppSelector(s => s.auth.user?.info);
    const statusVoice = useAppSelector(s => s.voice.status);
    const isConnection = (statusVoice == "connected");
    const join = useJoinVoiceRoom();

    const [getPeers] = useLazyGetPeersInRoomQuery();
    const roomPeers = useAppSelector((s) => s.voice.roomPeers);
    const connectStatus = useConnectToVoiceRoom();
    const leaveStatus = useLeaveRoom();
    
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

        dispatch(setStatus('needconn'));
    };

    return (
        <ErrorBoundary>
            {!(bigMode && isConnection) && <>
                {activeChat && (
                
                    <div className="flex flex-col h-full p-5 rounded-[5px] lg:h-screen  ">
                        <div className="flex bg-[#2e3ed328] text-white text-1xl justify-between items-center flex-wrap shrink-0">
                            <div className="text-5xl lg:text-base pl-5 p-2">
                                {activeChat.username} { roomPeers.length > 0 && <span>Активный звонок {roomPeers.length}</span>}
                            </div>
                            <div className="flex gap-5 bg-[#2e3ed328] pr-10 lg:pr-5 pl-10 lg:pl-5 p-5 lg:p-2 w-full lg:w-auto justify-end">
                            <div className="w-full lg:w-auto 
                            ">
                                <input type="text" className="w-full lg:w-auto text-5xl lg:text-base rounded-[5px] bg-[#2e3ed328] pl-1" placeholder="Search" />
                            </div>
                            <div className="flex items-center">
                                
                                <button
                                    className="h-fit"
                                    onClick={joinVoiceRoom}
                                    disabled={isConnection}
                                    
                                >
                                    <Phone color="#fff" strokeWidth={1.25}  className="w-15 h-15 lg:w-auto lg:h-auto"/>
                                </button>
                                
                            </div>
                            </div>
                        </div>

                        
                        {activeChat && isConnection && voiceState.roomId === `ls-${activeChat.chat_id}`  &&  <VoiceComponets.VoiceRoomChat/>}
                        

                        {/* История чатов с ref */}
                        <HistoryChat bottomRef={bottomRef} />

                        {/* Ввод нового сообщения с scrollToBottom */}
                        <InputChat scrollToBottom={scrollToBottom} />
                    </div>
                
            )}
            </>}
            
        </ErrorBoundary>
    );
};

import React, { useEffect } from "react";
import { ChatItem } from "./Message/ChatItem";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { MessageMenuLayout } from "./Message/MessageMenuLayout";
import { useNavigate } from "react-router-dom";
import { useGetServersInsideQuery } from "../services/server";
import { chat } from "../features/chat/chatSlices";
import { voice } from "../features/server/serverSlices";
import { useVoiceChat } from "../app/hook/voicechat/useVoiceChat";
import AudioManager from "./Voice/AudioManager";
import { setToggleJoin } from "../features/voice/voiceSlices";
import { VoiceManager } from "./Voice/VoiceManager";

export const MessageMenuServer: React.FC = () => {
    const dispatch = useAppDispatch();
    const activeServer = useAppSelector((state) => state.server.activeserver);
    const { data, isLoading, isFetching, isError } = useGetServersInsideQuery(
        activeServer?.id,
    );
    const voiceState = useAppSelector((state) => state.voice);
    const navigator = useNavigate();

    const { streams, roomPeers, localPeerId } =
        useVoiceChat();

    useEffect(() => {
        if (!activeServer) {
            navigator("/app/");
        }
    }, []);

    if (isFetching) {
        return <>fetch</>;
    }

    if (isLoading) {
        return <>fetch</>;
    }

    if (isError) {
        return <>isError</>;
    }

    const joinVoiceRoom = (voiceId: number) => {
        if (!activeServer) return
        dispatch(setToggleJoin({isConnected: true, roomId: voiceId}))
    }

    return (
        <>
            <MessageMenuLayout>
                
                <h2>{data?.name}</h2>
                <div className="bg-server"></div>
                <ul className="server-list">
                    {data &&
                        data.chats.map((val: chat, index: number) => (
                            <ChatItem key={`${index}-chat-server`} chat={val} />
                        ))}

                    {data &&
                        data.voices.map((val: voice, index: number) => (
                            <li className="voice" key={`${index}-voice-server`}>
                                <button
                                onClick={() => {
                                    try {
                                        joinVoiceRoom(val.id);
                                    } catch (error) {
                                        console.error('Join room error:', error);
                                    }
                                }} 
                                disabled={voiceState.isConnected}>
                                
                                    <span>#</span> {val.name}
                                </button>
                                <ul className="in-voice">
                                {voiceState.roomId == val.id && roomPeers.map(peer => (
                                    <li key={peer.id}>
                                        <span><img src="/img/icon.png" alt="" width={"30px"} height={"30px"} /></span>
                                        {peer?.username}
                                    </li>
                                                
                                        ))}
                                </ul>
                            </li>
                        ))}
                    {streams.audioStreams && localPeerId ? <AudioManager
                        audioStreams={streams.audioStreams}
                        localPeerId={localPeerId}
                    />: null} 
                    
                </ul>
                <VoiceManager />
            </MessageMenuLayout>
        </>
    );
};

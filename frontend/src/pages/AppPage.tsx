import React, { useEffect, useRef } from "react";
import "../styles/pages/app.scss";
import { AppMenu } from "../components/AppMenu";
import { MessageMenu } from "../components/MessagesMenu";
import { Action } from "../components/Action";
import { setActiveServer } from "../features/server/serverSlices";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { MessageMenuServer } from "../components/ServerMessagesMenu";
import { useChatMessages } from "../app/hook/textchat/useChatMessages";
import { useVoiceChat } from "../app/hook/voicechat/useVoiceChat";
import AudioManager from "../components/Voice/AudioManager";
import RemoteVideo from "../components/RemoteVideo";
import { VoiceManager } from "../components/Voice/VoiceManager";
import { useDelayedVoiceChat } from "../app/hook/voicechat/useDelayedVoiceChat";
import { MessageGroupp } from "../types/Message";

export const AppPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const server = useAppSelector((state) => state.server);
    const token = useAppSelector((state) => state.auth.user?.access_token);
    const myUsername =
        useAppSelector((state) => state.auth.user?.username) ?? "";

    useEffect(() => {
        dispatch(setActiveServer(undefined));
    }, []);
    const activeChat = useAppSelector((state) => state.chat.activeChat);

    const {
        groupedMessages,
        sendMessage,
        setEnable,
        setDisable,
        isSocketConnected,
    } = useChatMessages(String(activeChat?.id), token, myUsername);

    const {
        joinRoom,
        leaveRoom,
        streams,
        localStreamRef,
        mutedPeers,
        mute,
        audioOnly,
        localPeerId,
    } = useDelayedVoiceChat();

    useEffect(() => {
        if (activeChat && !isSocketConnected) setEnable();
        return () => {
            if (isSocketConnected) setDisable();
        };
    }, [activeChat, isSocketConnected, setEnable, setDisable]);

    return (
        <>
            <div className="main-app">
                <AppMenu />

                {server.activeserver ? <MessageMenuServer /> : <MessageMenu />}

                <Action
                    joinRoomApi={joinRoom}
                    handleSendMessage={sendMessage}
                    Messages={groupedMessages as MessageGroupp[]}
                    videoStreams={streams.videoStreams!}
                />
                {streams.audioStreams ? (
                    <AudioManager
                        audioStreams={streams.audioStreams}
                        mutedPeers={mutedPeers}
                        localPeerId={localPeerId!}
                        onPlaybackError={(id, err) =>
                            console.error(`Playback error for ${id}:`, err)
                    }
                
                /> 
                ): null}
                
                <VoiceManager
                    leaveRoom={leaveRoom}
                    mute={mute}
                    audioOnly={audioOnly}
                />
            </div>
        </>
    );
};

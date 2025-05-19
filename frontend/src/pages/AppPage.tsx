import React, { useEffect, useRef } from "react";
import "../styles/pages/app.scss";
import "../styles/pages/appserver.scss";
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
import { MemberChatServer } from "../components/MemberChatServer";
import { Profile } from "../components/UserInfo/UserProfile";
import { AddServerForm } from "../components/Server/Add/AddServerForm";
import { FriendList } from "../components/FriendList/FriendList";
import { setActiveChat } from "../features/chat/chatSlices";
import { useLazyGetServersMembersQuery } from "../services/server";

export const AppPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const server = useAppSelector((state) => state.server);
    const token = useAppSelector((state) => state.auth.user?.access_token);
    const myUsername =
        useAppSelector((state) => state.auth.user?.username) ?? "";
    const activeChat = useAppSelector((state) => state.chat.activeChat);
    const [trigger, {data: userss}] = useLazyGetServersMembersQuery();


    useEffect(()=> {
        if (!server.activeserver) return
        trigger(server.activeserver?.id)
    }, [server.activeserver])


    useEffect(() => {
        dispatch(setActiveServer(undefined));
    }, []);
    useEffect(() => {
        dispatch(setActiveChat(undefined));
    }, []);

    const {
        groupedMessages,
        sendMessage,
        setEnable,
        setDisable,
        isSocketConnected,
    } = useChatMessages(String(activeChat?.id), token, myUsername);

    const {
        streams,
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
                <Profile />
                <AddServerForm />
                {server.activeserver ? <MessageMenuServer /> : <MessageMenu />}

                
                    
                {!activeChat ? null :
                    <Action
                    handleSendMessage={sendMessage}
                    Messages={groupedMessages as MessageGroupp[]}
                    videoStreams={streams.videoStreams!}
                />
                }

                {(!activeChat && !server.activeserver) && <FriendList />}

                {(server.activeserver && !activeChat) && <div className="actions"></div>}
                
                
                {streams.audioStreams ? (
                    <AudioManager
                        audioStreams={streams.audioStreams}
                        localPeerId={localPeerId!}
                        onPlaybackError={(id, err) =>
                            console.error(`Playback error for ${id}:`, err)
                    }
                
                /> 
                ): null}
                
                
                {server.activeserver && <MemberChatServer /> }
            </div>
        </>
    );
};

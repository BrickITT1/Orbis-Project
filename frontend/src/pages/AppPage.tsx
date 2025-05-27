import React, { useEffect } from "react";
import "../styles/pages/app.scss";
import "../styles/pages/appserver.scss";
import { AppMenu } from "../components/AppMenu";
import { MessageMenu } from "../components/MessagesMenu";
import { Action } from "../components/Action";
import { setActiveServer } from "../features/server/serverSlices";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { MessageMenuServer } from "../components/ServerMessagesMenu";
import { useChatMessages } from "../app/hook/textchat/useChatMessages";
import { useDelayedVoiceChat } from "../app/hook/voicechat/useDelayedVoiceChat";
import AudioManager from "../components/Voice/AudioManager";
import { MemberChatServer } from "../components/MemberChatServer";
import { Profile } from "../components/UserInfo/UserProfile";
import { AddServerForm } from "../components/Server/Add/AddServerForm";
import { FriendList } from "../components/FriendList/FriendList";
import { setActiveChat } from "../features/chat/chatSlices";
import { useLazyGetServersMembersQuery } from "../services/server";
import { Search } from "../components/Search/Search";
import { VideoManager } from "../components/Voice/VideoManager";

export const AppPage: React.FC = () => {
    const dispatch = useAppDispatch();

    const server = useAppSelector((state) => state.server);
    const activeChat = useAppSelector((state) => state.chat.activeChat);
    const [trigger] = useLazyGetServersMembersQuery();

    const activeServerId = server.activeserver?.id;
    
    useEffect(() => {
        if (activeServerId) {
            trigger(activeServerId);
            dispatch(setActiveChat(undefined));
        }
    }, [activeServerId]);

    useEffect(() => {
        dispatch(setActiveServer(undefined));
        dispatch(setActiveChat(undefined));
    }, [dispatch]);

    const {} = useChatMessages();

    const {
        localPeerId,
    } = useDelayedVoiceChat();

    const hasActiveChat = Boolean(activeChat);
    const hasActiveServer = Boolean(server.activeserver);

    return (
        <div className="main-app">

            {/* {Меню приложения} */}
            <AppMenu />

            {/* {Профиль пользователей} */}
            <Profile />

            {/* {Добавление сервера} */}
            <AddServerForm />

            {/* {Поиск друзей} */}
            <Search />

            {/* {На сервере: чаты и голосовые сервера, в лс: чаты пользователя} */}
            {hasActiveServer ? <MessageMenuServer /> : <MessageMenu />}

            {/* {Чат} */}
            {hasActiveChat && (
                <Action />
            )}

            {/* {Список друзей} */}
            {!hasActiveChat && !hasActiveServer && <FriendList />}

            {/* {Заглушка} */}
            {hasActiveServer && !hasActiveChat && <div className="actions"></div>}

            {/* {Аудио менеджер} */}
            
            <AudioManager />
            
            {/* {Видео менеджер}*/}
                {/* <VideoManager videoStreams={streams.videoStreams!}
                /> */}

            {hasActiveServer && <MemberChatServer />}
        </div>
    );
};

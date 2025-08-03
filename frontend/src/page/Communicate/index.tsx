import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setActiveChat, useChatMessages } from "@/features/chat";
import { CreateServerForm, setActiveServer, useLazyGetServersInsideQuery, useLazyGetServersMembersQuery } from "@/features/server";
import { FriendList, Search, UserProfile } from "@/features/user";
import { setBigMode, VoiceComponets } from "@/features/voice";
import React, { useEffect, useState } from "react";
import { AppMenu } from "./components/AppMenu";
import { MessageMenu } from "./components/personal/MessagesMenu";
import { MemberChatServer } from "./components/server/MemberChatServer";
import { Action } from "./components/personal/ActionPersonal";
import { ActionServer } from "./components/server/ActionServer";
import { MessageServerMenu } from "./components/server/MessagesServerMenu";

export const CommunicatePage: React.FC = () => {
    const dispatch = useAppDispatch();

    const server = useAppSelector((state) => state.server);
    const activeChat = useAppSelector((state) => state.chat.activeChat);
    const status = useAppSelector(s => s.voice.status)
    const isConnection = (status === 'connected');
    const bigMode = useAppSelector(s => s.voice.bigMode);
    const [trigger] = useLazyGetServersMembersQuery();
    const [getServer] = useLazyGetServersInsideQuery();
    const [isMessageMenuOpen, setIsMessageMenuOpen] = useState(true);
    
    const activeServerId = server.activeserver?.id;
    
    useEffect(() => {
        if (activeServerId) {
            dispatch(setBigMode(false));
            trigger(activeServerId);
            getServer(activeServerId)
            dispatch(setActiveChat(undefined));
        }
    }, [activeServerId]);

    useEffect(() => {
        dispatch(setBigMode(false));
        dispatch(setActiveServer(undefined));
        dispatch(setActiveChat(undefined));
    }, [dispatch]);

    const {} = useChatMessages();

    const hasActiveChat = Boolean(activeChat);
    const hasActiveServer = Boolean(server.activeserver);

    if (hasActiveServer) {
        return (
            <div className="flex h-screen w-screen">
            <AppMenu />
            <MessageServerMenu />

            {(isConnection && bigMode) &&
                <div className="w-full h-full flex flex-col justify-between items-center p-10">
                    <VoiceComponets.VoiceMemberManager />
                 </div>
            }
            
            {(hasActiveChat && !bigMode) ? (
                <div className="w-full h-screen">
                    <ActionServer />
                </div>
                
            ): !bigMode  && (<div className="w-full"></div>)}
            <CreateServerForm />
            <UserProfile />
            {hasActiveServer && <MemberChatServer />}
            </div>
        )
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen w-screen">

            {/* {Меню приложения} */}
            <AppMenu />

            {/* {Профиль пользователей} */}
            <UserProfile />

            {/* {Добавление сервера} */}
            <CreateServerForm />

            {/* {Поиск друзей} */}
            <Search />
            <div className="w-full flex h-full relative">
            {/* {чаты пользователя} */}
            {isMessageMenuOpen ? <MessageMenu /> :null}
            

            

            {(isConnection && bigMode) &&
                <div className="w-full h-full flex flex-col justify-between items-center p-10">
                    <VoiceComponets.VoiceMemberManager />
                 </div>
            }

            {/* {Чат} */}
            {(hasActiveChat && !bigMode) ? (
                <div className="w-full h-full lg:h-screen">
                    <Action />
                </div>
                
            ): !bigMode && hasActiveChat  && (<div className="w-full"></div>)}

            {/* {Список друзей} */}
            {!hasActiveChat && !hasActiveServer && <FriendList />}
            </div>

            {/* {Аудио менеджер} */}
            <VoiceComponets.AudioManager />

        </div>
    );
};

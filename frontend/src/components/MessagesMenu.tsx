import React from "react";
import { useAppSelector } from "../app/hooks";
import { useGetChatsQuery } from "../services/chat";
import { MessageMenuLayout } from "./Message/MessageMenuLayout";
import { ChatItem } from "./Message/ChatItem";
import { VoiceManager } from "./Voice/VoiceManager";

export const MessageMenu: React.FC = () => {
    const chats = useAppSelector((state) => state.chat.chat);
    const {} = useGetChatsQuery({});
    return (
        <>
            <MessageMenuLayout>
                <div className="Input">
                    <button>Начать поиск</button>
                </div>
                <div className="friend">
                    <button>Друзья</button>
                    
                </div>

                <ul className="group-list">
                    {chats &&
                        chats.map((val, index) => (
                            <ChatItem key={index} chat={val} />
                        ))}
                </ul>
                <VoiceManager />
            </MessageMenuLayout>
        </>
    );
};

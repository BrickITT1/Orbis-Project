import React from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useGetChatsQuery } from "../services/chat";
import { MessageMenuLayout } from "./Message/MessageMenuLayout";
import { ChatItem } from "./Message/ChatItem";
import { VoiceManager } from "./Voice/VoiceManager";
import { setActiveChat } from "../features/chat/chatSlices";

export const MessageMenu: React.FC = () => {
    const chats = useAppSelector((state) => state.chat.chat);
    const dispatch = useAppDispatch();
    const {} = useGetChatsQuery({});
    return (
        <>
            <MessageMenuLayout>
                <div className="personal-menu">
                    <div className="Input">
                    <button>Search</button>
                </div>
                <div className="friend">
                    <button onClick={() => dispatch(setActiveChat(undefined))}>Friends</button>
                    
                </div>

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

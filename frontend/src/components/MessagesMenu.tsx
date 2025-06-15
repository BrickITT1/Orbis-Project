import React from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useGetChatsUsersQuery } from "../services/user";
import { MessageMenuLayout } from "./Message/MessageMenuLayout";
import { ChatItem } from "./Message/ChatItem";
import { VoiceManager } from "./Voice/VoiceManager";
import { setActiveChat } from "../features/chat/chatSlices";

export const MessageMenu: React.FC = () => {
    const chats = useAppSelector((state) => state.user.chats);
    const dispatch = useAppDispatch();
    const {} = useGetChatsUsersQuery({});
    
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
                <div className="personal-manager">
                        <VoiceManager />
                </div>
                
            </MessageMenuLayout>
        </>
    );
};

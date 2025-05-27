import React from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { chat, setActiveChat } from "../../features/chat/chatSlices";

export const ChatItem: React.FC<{ chat: chat }> = ({ chat }) => {
    const active = useAppSelector((state) => state.chat.activeChat);
    const activeServer = useAppSelector(s => s.server.activeserver?.id);
    const dispatch = useAppDispatch();

    return (
        <>
            <li
                className="group-item"
                onClick={() => {
                    dispatch(setActiveChat(chat));
                }}
            >
                <div className={active?.chat_id == chat.chat_id ? "active" : ""}>
                    <div className="group-item__avatar">
                        <img src={chat.avatar_url} alt="" />
                    </div>
                    <div className="group-item__name">{activeServer ? chat.name : chat?.username}</div>
                </div>
            </li>
        </>
    );
};

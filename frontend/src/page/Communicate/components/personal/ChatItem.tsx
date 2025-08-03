import React from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { chat, setActiveChat } from "@/features/chat";
import { setActivePersonalCommunicate } from "@/features/action";

export const ChatItem: React.FC<{ chat: chat }> = ({ chat }) => {
    const active = useAppSelector((state) => state.chat.activeChat);
    const dispatch = useAppDispatch();

    return (
        <>
            <li
                className=" cursor-pointer hover:brightness-90 select-none"
                onClick={() => {
                    dispatch(setActiveChat(chat));
                    dispatch(setActivePersonalCommunicate(window.innerWidth > 1024 || false));
                }}
            >
                <div className={
                    active?.chat_id == chat.chat_id ? 
                    "flex bg-[#ffffff3a] gap-3 items-center p-1 rounded-[5px]" : 
                    "flex gap-3 items-center p-1"
                }>
                    <div className="w-fit">
                        <img src={chat.avatar_url} alt="" className="w-20 h-20 lg:w-7 lg:h-7"/>
                    </div>
                    <div className="text-3xl lg:text-base truncate w-full shrink-10 lg:max-w-50">{chat.username}</div>
                </div>
            </li>
        </>
    );
};

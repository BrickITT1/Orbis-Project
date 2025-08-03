import React from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { chat, setActiveChat } from "@/features/chat";

export const ServerItem: React.FC<{ chat: chat }> = ({ chat }) => {
    const active = useAppSelector((state) => state.chat.activeChat);
    const dispatch = useAppDispatch();

    return (
        <>
            <li
                className="bg-[#2236ec4f] rounded-[5px]"
                onClick={() => {
                    dispatch(setActiveChat(chat));
                }}
                
            >
                <button className={active?.chat_id == chat.chat_id ? "flex brightness-110 gap-3 items-center p-2 rounded-[5px] cursor-pointer " : "flex gap-3 items-center p-2 rounded-[5px] cursor-pointer"}>
                    
                    <div className="truncate w-full shrink-10 max-w-50">{chat.name}</div>
                </button>
            </li>
        </>
    );
};

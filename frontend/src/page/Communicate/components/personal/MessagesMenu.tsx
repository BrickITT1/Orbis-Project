import React from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { setActiveChat } from "@/features/chat";
import { ChatItem } from "./ChatItem";
import { VoiceComponets } from "@/features/voice";
import { useGetChatsUsersQuery } from "@/features/user";
import { MenuButton } from "../ui/Button";
import { setActivePersonalCommunicate } from "@/features/action";

export const MessageMenu: React.FC = () => {
    const chats = useAppSelector((state) => state.user.chats);
    const isPersonalMessageMenu = useAppSelector((s)=>s.action.isPersonalCommunicateActive)
    const dispatch = useAppDispatch();
    const {} = useGetChatsUsersQuery({});

    if (!isPersonalMessageMenu) {
        return null
    }
    
    return (
        <>
            <div className="absolute lg:relative z-20 flex flex-col bg-[rgb(81,110,204)]  lg:bg-[rgba(81,110,204,0.12)] p-5  gap-5 justify-between h-full w-full lg:min-w-[250px] lg:max-w-[250px]">
                <div className="flex flex-col gap-5 h-full">
                <div className="text-5xl lg:text-base flex flex-col gap-5 text-white ">
                    <div className="">
                        <MenuButton handler={()=>{}}>Search</MenuButton>
                    </div>
                    <div className="">
                        <MenuButton handler={
                            () => {
                                dispatch(setActiveChat(undefined))
                                dispatch(setActivePersonalCommunicate(window.innerWidth > 1024 || !isPersonalMessageMenu));
                            }
                        }>Friends</MenuButton>
                    
                    </div>
                </div>
                
                <ul className="flex flex-col gap-2 h-full  text-white rounded-[5px]" >
                    {chats &&
                        chats.map((val, index) => (
                            <ChatItem key={index} chat={val} />
                        ))}
                </ul>
                <div className="personal-manager">
                    <VoiceComponets.VoiceManager />
                </div>
                </div>
                
            </div>
        </>
    );
};

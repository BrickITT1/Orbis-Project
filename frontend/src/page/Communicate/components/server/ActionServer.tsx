import React, {  useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { HistoryChat, InputChat } from "@/features/chat";
import { setStatus, useJoinVoiceRoom } from "@/features/voice";

export const ActionServer: React.FC = () => {
    const activeChat = useAppSelector(state => state.chat.activeChat);
    const bigMode = useAppSelector(s => s.voice.bigMode);
    const statusVoice = useAppSelector(s => s.voice.status);
    const isConnection = (statusVoice == "connected");
    const bottomRef = useRef<HTMLDivElement>(null);
    
    

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    

    return (
        <> 
        {!(bigMode && isConnection) && <>
                {activeChat && (
                
                    <div className="flex flex-col h-full w-full p-5 rounded-[5px]">
                        <div className="flex bg-[#2e3ed328] text-white text-1xl rounded-t-[5px] justify-between items-center flex-wrap">
                            <div className="p-2 pl-5">
                                {activeChat.name}
                            </div>
                            <div className="pr-5 pl-5 p-2
                            ">
                                <input type="text" className="rounded-[5px] bg-[#2e3ed328] pl-1" placeholder="Search" />
                            </div>
                        </div>

                        {/* История чатов с ref */}
                        <HistoryChat bottomRef={bottomRef} />

                        {/* Ввод нового сообщения с scrollToBottom */}
                        <InputChat scrollToBottom={scrollToBottom} />
                    </div>
                
            )}
            </>}
        </>

    );
};

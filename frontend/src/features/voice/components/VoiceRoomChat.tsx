import React from "react";
import { VoiceMember } from "./VoiceMember";
import { VoiceManager } from "./Audio/VoiceManager";
import { useAppSelector } from "@/app/hooks";

export const VoiceRoomChat: React.FC = () => {
    const bigMode = useAppSelector(s => s.voice.bigMode);

    return (
        <>
        {!bigMode &&
            <div className="text-white p-10">
                <ul className="flex flex-wrap gap-5 justify-center items-center">
                    {/* Участники */}
                    
                    <VoiceMember typeMember='chat' />
                    
                </ul>
                <div className="pt-5 pl-10 pr-10 ">
                    <VoiceManager />
                </div>
                
            </div>
        }
            
        </>
    );
};

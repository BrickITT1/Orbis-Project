import React, { useState } from "react";
import { VoiceMember } from "./VoiceMember";
import { VoiceManager } from "./VoiceManager";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setBigMode } from "../../features/voice/voiceSlices";

export const VoiceRoomChat: React.FC = () => {

    const bigMode = useAppSelector(s => s.voice.bigMode);

    return (
        <>
        {!bigMode &&
            <div className="voice-chat">
                <ul className="users">
                    {/* Участники */}
                    
                    <VoiceMember typeMember='chat' />
                    
                </ul>
                <div className="voice-manager-ls">
                    <VoiceManager />
                </div>
                
            </div>
        }
            
        </>
    );
};

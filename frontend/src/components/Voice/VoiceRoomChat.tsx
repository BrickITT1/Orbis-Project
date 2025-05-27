import React from "react";
import { VoiceMember } from "./VoiceMember";

export const VoiceRoomChat: React.FC = () => {

    

    return (
        <>
            <div className="voice-chat">
                <ul className="users">
                    {/* Участники */}
                    <VoiceMember typeMember='chat' />
                
                </ul>
            </div>
        </>
    );
};

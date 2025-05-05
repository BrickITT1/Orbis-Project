import React from "react";
import { VoiceMember } from "./VoiceMember";

export const VoiceRoomChat: React.FC<{
    videoStreams: Record<string, MediaStream>;
}> = ({ videoStreams }) => {

    return (
        <>
            <div className="voice-chat">
                <ul className="users">
                    {/* Участники */}
                    <VoiceMember typeMember='chat' videoStreams={videoStreams} />
                
                </ul>
            </div>
        </>
    );
};

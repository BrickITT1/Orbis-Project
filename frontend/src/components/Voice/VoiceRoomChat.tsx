import React from "react";
import { PeerInfo } from '../../types/Channel';
import { VoiceMember } from "./VoiceMember";
import RemoteVideo from "../RemoteVideo";
import AudioManager from "./AudioManager";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setAudioOnly } from "../../features/voice/voiceSlices";


export const VoiceRoomChat: React.FC =() => {
    const roomPeers = useAppSelector(state => state.voice.peers);
    
    return (
        <>
        <div className="voice-chat">
            <ul className="users">
                {/* Участники */}
                <VoiceMember typeMember='chat' roomPeers={roomPeers} />
            </ul>
            
            </div>
        </>
    )
}
import React from "react";
import { PeerInfo } from '../../types/Channel';
import { VoiceMember } from "./VoiceMember";
import RemoteVideo from "../RemoteVideo";
import AudioManager from "./AudioManager";
import { useAppDispatch, useAppSelector } from "../../app/hooks";


export const VoiceRoomChat: React.FC<{videoStreams: Record<string, MediaStream>}> =({videoStreams}) => {
    const roomPeers = useAppSelector(state => state.voice.roomPeers);
    
    return (
        <>
        <div className="voice-chat">
            <ul className="users">
                {/* Участники */}
                <VoiceMember typeMember='chat' roomPeers={roomPeers} videoStreams={videoStreams} />
            </ul>
            
            </div>
        </>
    )
}
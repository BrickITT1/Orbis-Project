import React from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setMyPeer } from "../../features/voice/voiceSlices";

interface VoiceManagerProps {
    leaveRoom: () => Promise<void> | any;
    mute: (shouldMute: boolean) => Promise<void> | any
    audioOnly: boolean;
}

export const VoiceManager: React.FC<VoiceManagerProps> = ({leaveRoom, mute, audioOnly}) => {
    if (!leaveRoom && !mute && !audioOnly) return;
    const dispatch = useAppDispatch()
    const MyPeer = useAppSelector(s => s.voice.myPeer)
    const toggleAudioOnly = () => {
        dispatch(setMyPeer({...MyPeer, audioOnly: !audioOnly}))
    }
    
    return (
        <>
            <div className="voice-manager">
            <button onClick={() => mute(true)}>Mute</button>
            <button onClick={() => mute(false)}>Unmute</button>
            <button onClick={leaveRoom}>Leave</button>
            <button onClick={() => toggleAudioOnly()}>
                {audioOnly ? 'Вкл. видео' : 'Только аудио'}
            </button>
            </div>
            
        </>
    )
}
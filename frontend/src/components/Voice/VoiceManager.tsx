import React from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

interface VoiceManagerProps {
    leaveRoom: () => Promise<void> | any;
    setAudioOnly: React.Dispatch<React.SetStateAction<boolean>> | any;
    mute: (shouldMute: boolean) => Promise<void> | any
    audioOnly: boolean;
}

export const VoiceManager: React.FC<VoiceManagerProps> = ({leaveRoom, setAudioOnly, mute, audioOnly}) => {
    if (!leaveRoom && !setAudioOnly && !mute && !audioOnly) return;

    const toggleAudioOnly = () => {
        setAudioOnly(!audioOnly)
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
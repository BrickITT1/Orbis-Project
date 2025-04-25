import React, { useEffect, useRef } from 'react';
import '../styles/pages/app.scss'
import { AppMenu } from '../components/AppMenu';
import { MessageMenu } from '../components/MessagesMenu';
import { Action } from '../components/Action';
import { setActiveServer } from '../features/server/serverSlices';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { MessageMenuServer } from '../components/ServerMessagesMenu';
import { useChatMessages } from '../app/hook/textchat/useChatMessages';
import { useVoiceChat } from '../app/hook/voicechat/useVoiceChat';
import AudioManager from '../components/Voice/AudioManager';
import RemoteVideo from '../components/RemoteVideo';
import { VoiceManager } from '../components/Voice/VoiceManager';
import { useDelayedVoiceChat } from '../app/hook/voicechat/useDelayedVoiceChat';

export const AppPage: React.FC = () =>  {
    const dispatch = useAppDispatch();
    const server = useAppSelector(state => state.server);
    const token = useAppSelector(state => state.auth.user?.access_token);
    const MyUsername = useAppSelector(state => state.auth.user?.username);
    const localVideoRef = useRef<HTMLVideoElement>(null);
    
    useEffect(()=> {
        dispatch(setActiveServer(undefined))
    }, []);
    const activeChat = useAppSelector(state => state.chat.activeChat);

    const {
        messages,
        groupedMessages,
        newMessage,
        setNewMessage,
        sendMessage,
        setEnable,
        setDisable,
        isSocketConnected,
      } = useChatMessages(String(activeChat?.id), token, MyUsername);
    
    const {
        joinRoom,
        leaveRoom,
        audioStreams,
        videoStreams,
        roomPeers,
        mutedPeers,
        mute,
        audioOnly,
        setAudioOnly,
        localPeerId
      } = useDelayedVoiceChat({ localVideoRef });

      

    useEffect(() => {
        if (activeChat && !isSocketConnected) setEnable();
        return () => {
        if (isSocketConnected) setDisable();
        };
    }, [activeChat, isSocketConnected, setEnable, setDisable]);

    return ( 
        <>
            <div className="main-app">
                <AppMenu />
                
                
                {server.activeserver ? (
                    <MessageMenuServer />
                ): (
                    <MessageMenu />
                )}
                
                <Action localVideo={localVideoRef} joinRoom={joinRoom}/>
                <AudioManager
                    audioStreams={audioStreams}
                    mutedPeers={mutedPeers}
                    localPeerId={localPeerId!}
                    onPlaybackError={(id, err) =>
                        console.error(`Playback error for ${id}:`, err)
                }
                
                />
                <VoiceManager leaveRoom={leaveRoom} setAudioOnly={setAudioOnly} mute={mute} audioOnly={audioOnly}/>
                
                <video ref={localVideoRef} autoPlay muted playsInline style={{ width: 200 }} />
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {Object.entries(videoStreams).map(([id, stream]) => (
                        <RemoteVideo key={id} stream={stream} />
                    ))}
                </div>
            </div>
        </> 
    );
}
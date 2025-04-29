import React, { useEffect, useRef } from 'react';
import { ChatItem } from './Message/ChatItem';
import { useAppSelector } from '../app/hooks';
import { MessageMenuLayout } from './Message/MessageMenuLayout';
import { useNavigate } from 'react-router-dom';
import { useGetServersInsideQuery } from '../services/server';
import { chat } from '../features/chat/chatSlices';
import { voice } from '../features/server/serverSlices';
import { useVoiceChat } from '../app/hook/voicechat/useVoiceChat';
import AudioManager from './Voice/AudioManager';


export const MessageMenuServer: React.FC = () =>  {
    const activeServer = useAppSelector((state) => state.server.activeserver);
    const {data, isLoading, isFetching, isError} = useGetServersInsideQuery(activeServer?.id);
    const voiceState = useAppSelector(state => state.voice)
    const navigator = useNavigate();

    const {
          joinRoom,
          leaveRoom,
          streams,
          roomPeers,
          mutedPeers,
          localPeerId
    } = useVoiceChat();

    useEffect(()=> {
        if (!activeServer) {
            navigator('/app/')
        }
    }, [])
    
    if (isFetching) {
        return (<>fetch</>)
    }

    if (isLoading) {
        return (<>fetch</>)
    }

    if (isError) {
        return (<>isError</>)
    }
    
    
    return ( 

        <>
            <MessageMenuLayout>
                <h2>{data?.name}</h2>
                <div className="bg-server">

                </div>
                <ul className="server-list">
                    {data && data.chats.map((val: chat, index: number) => (
                        
                        
                            <ChatItem key={index} chat={val} />
                        
                        
                    ))}

                    {data && data.voices.map((val: voice, index: number) => (
                        <li className='voice'>
                            <button 
                            onClick={() => {
                                try {
                                  joinRoom(val.id);
                                } catch (error) {
                                  console.error('Join room error:', error);
                                }
                              }} 
                            disabled={voiceState.isConnected}>
                            
                                <span>#</span> {val.name}
                           
                            
                            </button>
                            <ul className="in-voice">
                            {voiceState.roomId == val.id && roomPeers.map(peer => (
                                <li key={peer.id}>
                                    <span><img src="/img/icon.png" alt="" width={"30px"} height={"30px"} /></span>
                                    {peer?.username}
                                    <div className="voice-leave" onClick={leaveRoom}>
                                    <button>
                                        <svg width="52" height="22" viewBox="0 0 52 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" clipRule="evenodd" d="M26.001 1C46.9715 1.0013 50.2823 7.6485 50.7243 10.4505C50.8323 10.8648 52.5715 20.0957 45.7465 20.8117C28.766 22.5472 40.4397 10.792 25.9992 11.2385C11.5586 11.685 23.232 22.5473 6.25485 20.8125C-0.571774 20.095 1.16773 10.864 1.27583 10.4532C1.71635 7.6495 5.02895 1.0004 26.001 1Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                                </li>
                                
                            ))}

                            
                            </ul>
                        </li>
                        
                    ))}
                     
                    <AudioManager  audioStreams={streams.audioStreams!} mutedPeers={mutedPeers} localPeerId={localPeerId!}/>
                </ul>
            </MessageMenuLayout>
        </> 
    );
}
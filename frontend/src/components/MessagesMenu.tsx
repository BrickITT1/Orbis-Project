import React, { useEffect } from 'react';
import { Chat } from './Message/Chat';
import { useAppSelector } from '../app/hooks';
import { useGetChatsQuery } from '../services/chat';
import useChatSocket from '../app/hook/textchat/useChatSocket';
import { useRefreshTokenQueryQuery } from '../services/auth';
import { MessageMenuLayout } from './Message/MessageMenuLayout';


export const MessageMenu: React.FC = () =>  {
    const chats = useAppSelector(state => state.chat.chat)
    const activeChat = useAppSelector(state => state.chat.activeChat);
    const {} = useGetChatsQuery({});
    return ( 
        <>
            <MessageMenuLayout>
                <h2>Чаты</h2>
                <ul className="group-list">
                    
                    {
                        chats && (
                            chats.map((val, index)=>(
                                <Chat key={index} chat={val}/>
                            ))
                        )
                    }
                </ul>
            </MessageMenuLayout>
            
            
        </> 
    );
}
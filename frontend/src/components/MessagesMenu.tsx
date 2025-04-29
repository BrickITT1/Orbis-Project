import React, { useEffect } from 'react';
import { useAppSelector } from '../app/hooks';
import { useGetChatsQuery } from '../services/chat';
import { useRefreshTokenQueryQuery } from '../services/auth';
import { MessageMenuLayout } from './Message/MessageMenuLayout';
import { ChatItem } from './Message/ChatItem';


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
                                <ChatItem key={index} chat={val}/>
                            ))
                        )
                    }
                </ul>
            </MessageMenuLayout>
            
            
        </> 
    );
}
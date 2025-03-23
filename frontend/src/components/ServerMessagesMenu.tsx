import React, { useEffect } from 'react';
import { Chat } from './Message/Chat';
import { useAppSelector } from '../app/hooks';
import { useGetChatsQuery } from '../services/chat';
import useChatSocket from '../app/useChatSocket';
import { useRefreshTokenQueryQuery } from '../services/auth';
import { MessageMenuLayout } from './Message/MessageMenuLayout';


export const MessageMenuServer: React.FC = () =>  {
    
    return ( 
        <>
            <MessageMenuLayout>
                <h2>Имя сервера</h2>
                <div className="bg-server">

                </div>
                <ul className="server-list">
                    <li className='text'>
                        <div className="name">
                            <span>#</span> text chat
                        </div>
                    </li>
                    <li className='voice'>
                        <div className="name">
                            <span>#</span> voice chat
                        </div>
                        <ul className="in-voice">
                            <li><span><img src="/img/icon.png" alt="" width={"30px"} height={"30px"} /></span>user 1</li>
                            <li><span><img src="/img/icon.png" alt="" width={"30px"} height={"30px"} /></span>user 1</li>
                            <li><span><img src="/img/icon.png" alt="" width={"30px"} height={"30px"} /></span>user 1</li>
                        </ul>
                    </li>

                </ul>
            </MessageMenuLayout>
            
            
        </> 
    );
}
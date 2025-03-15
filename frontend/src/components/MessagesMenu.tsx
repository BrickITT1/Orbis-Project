import React, { useEffect } from 'react';
import { Chat } from './Message/Chat';
import { useAppSelector } from '../app/hooks';
import { useGetChatsQuery } from '../services/chat';
import useChatSocket from '../app/useChatSocket';
import { useRefreshTokenQueryQuery } from '../services/auth';


export const MessageMenu: React.FC = () =>  {
    const chats = useAppSelector(state => state.chat.chat)
    const activeChat = useAppSelector(state => state.chat.activeChat)
    const {data, refetch} = useGetChatsQuery({});
    
    return ( 
        <>
            <div className="messages-menu">
                <h1>ORBIS<span>chat</span></h1>
                <div className="messages-menu_list">
                    <div className="messages-menu_list-group">
                        <h2>Чаты</h2>
                        <ul className="group-list">
                            
                            {
                                chats && (
                                    chats.map((val, index)=>(
                                        <Chat key={index} name={val.name} avatar={val.avatar} isGroup={val.isGroup} number={index} chat_id={val.chat_id}/>
                                    ))
                                )
                            }
                            
                            
                            {/* {
                                Array.from({length: 8}).map((_, index) => (
                                    <li className="group-item">
                                        <div className="" key={index + 100}>
                                            <div className="group-item__avatar">
                                                <img src="/img/icon.png" alt="" />
                                            </div>
                                            Друзья {index}
                                        </div>
                                    </li>
                                ))
                            } */}
                        </ul>
                    </div>
                    
                </div>
                <div className="messages-menu_list-search">
                        <input type="text" />
                    </div>
            </div>
            
        </> 
    );
}
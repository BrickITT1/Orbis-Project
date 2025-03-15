
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setActiveChat } from '../../features/chat/chatSlices';

export const Chat: React.FC<{name: string, avatar: string, isGroup: boolean, number: number, chat_id: number}> = ({name, avatar, isGroup, number, chat_id}) =>  {
    const active = useAppSelector(state => state.chat.activeChat);
    const dispatch = useAppDispatch();
    

    return ( 
        <>
            <li className="group-item" onClick={()=> {
                dispatch(setActiveChat(chat_id));
                
            }}>
                <div className={active == chat_id ? "active": ""} >
                    <div className="group-item__avatar">
                        <img src={avatar} alt="" />
                    </div>
                    <div className="group-item__name">
                        {name}
                    </div>
                    
                </div>
            </li>
        </> 
    );
}

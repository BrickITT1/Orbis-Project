import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import useChatSocket from '../app/useChatSocket';
interface Message {
    id: number;
    text: string;
    user: string;
    timestamp: string;
}

export const Action: React.FC = () =>  {
    const activeChat = useAppSelector(state => state.chat.activeChat)
    const [newmessage, setNewMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]) 
    const socket = useChatSocket();
    useEffect(() => {
        if (socket) {
            socket.emit('join-room', activeChat);
        }
    }, [activeChat, ]);

    const sendMessage = () => {

        if (newmessage.trim() && activeChat && socket) {
          socket.emit('send-message', {
            room: activeChat,
            text: newmessage,
          });
          setNewMessage('');
        } else {
          alert('Выберите комнату и введите сообщение!');
        }
      };
      useEffect(() => {
        if (socket) {
          socket.on('new-message', (message: Message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
          });
          socket.on('message-history', (history: Message[]) => {
            setMessages(history);
          });
        //   socket.on('message-history', (history: Message[]) => {
        //     setMessages(history);
        //   });
    
        //   socket.on('user-left', ({ user, room }: { user: string; room: string }) => {
        //     setMessages((prevMessages) => [
        //       ...prevMessages,
        //       {
        //         id: Date.now(),
        //         text: `Пользователь ${user} покинул комнату.`,
        //         user: 'Система',
        //         timestamp: new Date().toLocaleTimeString(),
        //       },
        //     ]);
        //   });
    
          socket.on('error', (error: string) => {
            alert(error);
          });
    
          return () => {
            socket.off('new-message');
            socket.off('message-history');
          };
        }
      }, [socket]);

    return ( 
        <>
            <div className="actions">
                <div className="actions-main">
                    <div className="chat-title">
                      {activeChat}
                    </div>
                    <div className="messages">
                      {messages.map((val, idx) => (
                          <div key={idx}>{val.text}</div>
                      ))}
                    </div>
                    

                    
                    
                    <div className="chat-input">
                      <input type="text" value={newmessage} onChange={(e)=> setNewMessage(e.target.value)}/>
                      <button onClick={sendMessage}>Отправить</button>
                    </div>
                    
                </div>
            </div>
        </> 
    );
}
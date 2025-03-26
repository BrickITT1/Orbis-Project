import React from 'react';
import { Message } from '../../types/Message';

interface SingleMessageProps {
  message: Message;
}

export const SingleMessage: React.FC<SingleMessageProps> = ({ message }) => {
  return (
    <div className="message-container">
      <div className="avatar">
        <img 
          src="/img/icon.png" 
          alt={`Аватар ${message.user_id}`} 
          width={50}
          height={50}
        />
      </div>
      <div className="content">
        <h3 className="username">{message.user_id} <span className='message-time'>{message.timestamp.slice(0,5)}</span></h3>
        <div className="text">{message.content}</div>
      </div>
    </div>
  );
};
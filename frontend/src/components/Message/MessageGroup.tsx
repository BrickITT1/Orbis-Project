import React from 'react';
import { MessageGroupp } from '../../types/Message';

interface MessageGroupProps {
  group: MessageGroupp;
}

export const MessageGroup: React.FC<MessageGroupProps> = ({ group }) => {
  return (
    <div className="group">
        <div className="avatar">
          <img 
            src="/img/icon.png" 
            alt={`Аватар пользователя ${group.user_name}`} 
            width={50}
            height={50}
          />
        </div>
        <h3 className="username">{group.user_name} <span className='message-time'>{group.minute}</span></h3> 
       
      
      <div className="mess">
        {group.messages.map((message, index) => (
          <div 
            key={`${message.id}-${index}`}
            className={`message ${index === group.messages.length - 1 ? 'last' : ''}`}
          >
            <div className="text">{message.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
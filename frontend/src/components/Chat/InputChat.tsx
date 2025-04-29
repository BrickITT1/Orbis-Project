import React, { useRef, useState } from 'react';

export const InputChat: React.FC<{handleSendMessage: (newMessage: string) => void}> = ({ handleSendMessage }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [newMessage, setNewMessage] = useState('');

    
    
    const handleClick = () => {
        handleSendMessage(newMessage);
        setNewMessage(''); // Очищаем поле ввода после отправки
        inputRef.current?.focus(); // Возвращаем фокус на input
    };

    return (
        <div className="chat-input">
            <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                onKeyPress={e => e.key === 'Enter' && handleClick()} // Добавляем отправку по Enter
            />
            <button onClick={handleClick} className="enter-message">
                Отправить
            </button>
        </div>
    );
};
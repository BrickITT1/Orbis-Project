import React, { useRef, useState } from "react";

export const InputChat: React.FC<{
    handleSendMessage: (newMessage: string) => void;
}> = ({ handleSendMessage }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [newMessage, setNewMessage] = useState("");

    const handleClick = () => {
        handleSendMessage(newMessage);
        setNewMessage(""); // Очищаем поле ввода после отправки
        inputRef.current?.focus(); // Возвращаем фокус на input
    };

    return (
        <div className="chat-input">
            <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                onKeyPress={(e) => e.key === "Enter" && handleClick()} // Добавляем отправку по Enter
            />
            <button onClick={handleClick} className="enter-message">
            <svg width="37" height="36" viewBox="0 0 37 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.9408 2.14745L34.6459 18L2.9407 33.8526C2.50493 34.0705 2.04665 33.6 2.27591 33.1701L9.48824 19.6468C10.0373 18.6174 10.0372 17.3821 9.48823 16.3527L2.27601 2.82996C2.04674 2.40007 2.50504 1.92957 2.9408 2.14745Z" stroke="#FFF" strokeWidth="1.25"/>
            </svg>

            </button>
        </div>
    );
};

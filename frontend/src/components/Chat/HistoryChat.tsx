import React, { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { useLazyGetMessagesQuery } from "../../services/chat";
import { SingleMessage } from "../Message/SingleMessage";

export const HistoryChat: React.FC<{ bottomRef: React.RefObject<HTMLDivElement> }> = ({ bottomRef }) => {
    const history = useAppSelector(s => s.chat.activeHistory);
    const activeChat = useAppSelector(s => s.chat.activeChat);
    const [getMessages] = useLazyGetMessagesQuery();
    const menuRef = useRef<HTMLUListElement>(null);
    const messageHover = useAppSelector(s => s.chat.openMessage);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuVisible(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
      

    useEffect(() => {
        if (activeChat) getMessages(activeChat.chat_id);
    }, [activeChat]);

    if (!history) return null;
    

    const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault();
        e.stopPropagation();  // остановить всплытие, чтобы глобальный обработчик не сработал
        setMenuPosition({ x: e.pageX, y: e.pageY });
        setMenuVisible(true);
  };

  const handleOptionClick = (option: string) => {
    console.log(`[${history[0].username}] Вы выбрали: ${option}`);
    setMenuVisible(false);
  };
  
    return (
        <div className="messages" onContextMenu={handleContextMenu} >
            {history.map((message: any, idx) => (
                <SingleMessage key={`single-${message.chat_id}-${idx}`} message={message} />
            ))}
            <div ref={bottomRef} />
                {menuVisible && (
            <ul
            ref={menuRef}
            className="message-menu"
            
            style={{
                position: "fixed",
                top: `${menuPosition.y}px`,
                left: `${menuPosition.x}px`,
                zIndex: 9999,
            }}
            onContextMenu={(e) => e.preventDefault()}
            >
            <li onClick={() => handleOptionClick("Reply")}>Reply</li>
            <li onClick={() => handleOptionClick("Edit")}>Edit</li>
            <li onClick={() => handleOptionClick("Pin")}>Pin</li>
            <li onClick={() => handleOptionClick("Pin")}>Copy</li>
            <li onClick={() => handleOptionClick("Pin")}>Delete</li>
            </ul>
      )}
        </div>
    );
};

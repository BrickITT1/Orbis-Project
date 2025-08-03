import React, { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { SingleMessage } from "./SingleMessage";
import { setOpenMessage } from "../chatSlice";
import { useLazyGetMessagesQuery, useRemoveMessageMutation } from "../api/chatApi";


const HistoryChat: React.FC<{ bottomRef: React.RefObject<HTMLDivElement> }> = ({ bottomRef }) => {
    const history = useAppSelector(s => s.chat.activeHistory);
    const activeChat = useAppSelector(s => s.chat.activeChat);
    const [getMessages] = useLazyGetMessagesQuery();
    const menuRef = useRef<HTMLUListElement>(null);
    const messageHover = useAppSelector(s => s.chat.openMessage);
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const dispatch = useAppDispatch();
    const isOpen = useAppSelector(s => s.chat.openMessage);
    const [removeMessage, {isSuccess: succsessRemove}] = useRemoveMessageMutation()

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuVisible(false);
            }
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
      
    const handleMessageClick = (e: React.MouseEvent, message: any) => {
        e.preventDefault();
        e.stopPropagation();
        setMenuPosition({ x: e.pageX, y: e.pageY });
        setMenuVisible(true);
        dispatch(setOpenMessage(message));
        
    };


    useEffect(() => {
        if (activeChat) getMessages(activeChat.chat_id);
    }, [activeChat]);


    if (!history) return null;
    

    const handleOptionClick = (option: string) => {
        console.log(`[${history[0].username}] Вы выбрали: ${option}`);
        console.log(isOpen)
        setMenuVisible(false);
        dispatch(setOpenMessage(undefined));
    };

    const handleRemoveMessage = () => {
        const confirms = confirm('Вы уверены? ');
        console.log(isOpen?.id)
        if (confirms) {
            removeMessage({chat_id: isOpen?.chat_id, id: isOpen?.id});
        }
        setMenuVisible(false);
    }

    const handleCopyMessage = () => {
        if (!isOpen) return
        console.log(isOpen)
        navigator.clipboard.writeText(isOpen.content[0] && isOpen.content[0].text)
        setMenuVisible(false);
    }
  
    return (
        <div className="overflow-y-auto bg-[#25309b88] p-4 h-[calc(100vh_-_370px)] lg:h-screen text-white flex flex-col gap-3"  >
            {history.map((message: any, idx) => (
                <SingleMessage 
                    key={`single-${message.chat_id}-${idx}`} 
                    message={message} 
                    onClick={(e) => handleMessageClick(e, message)}
                />
            ))}
            <div ref={bottomRef} />
                {menuVisible && (
            <ul
                ref={menuRef}
                className="p-5 flex gap-3 flex-col bg-[#25309b88]"
                
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
            <li onClick={handleCopyMessage}>Copy text</li>
            <li onClick={handleRemoveMessage}>Delete</li>
            </ul>
      )}
        </div>
    );
};

export default HistoryChat;
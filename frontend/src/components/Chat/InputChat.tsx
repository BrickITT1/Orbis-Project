import React, { useRef, useState, useEffect } from "react";
import { useCreateMessagesMutation, useLazyGetMessagesQuery } from "../../services/chat";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { sendMessageVisual, setUploadState } from "../../features/chat/chatSlices";
import FileUploader from "../Upload/FileUploader";

type InputChatProps = {
    scrollToBottom: () => void;
};

export const InputChat: React.FC<InputChatProps> = ({ scrollToBottom }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const chat_id = useAppSelector(s => s.chat.activeChat?.chat_id);
    const UserInfo = useAppSelector(s => s.auth.user?.info);
    const activeChat = useAppSelector(s => s.chat.activeChat);
    const uploadedFiles = useAppSelector(s => s.upload.urls);
    const [newMessage, setNewMessage] = useState("");
    const [sendMessage, { data }] = useCreateMessagesMutation();
    const [getMessages] = useLazyGetMessagesQuery();
    const dispatch = useAppDispatch();

    const handleClick = () => {
        if (newMessage.trim().length === 0) return;

        const message = {
            id: chat_id,
            data: {
                content: { text: newMessage },
                reply_to_id: null,
                username: UserInfo?.username,
                user_id: UserInfo?.id,
                chat_id: chat_id
            }
        };

        dispatch(sendMessageVisual({
            id: Date.now(),
            content: [{ text: newMessage }],
            username: UserInfo?.username,
            user_id: UserInfo?.id,
            is_edited: false,
            timestamp: new Date().toLocaleTimeString(),
        }));

        sendMessage(message);
        setNewMessage("");
        inputRef.current?.focus();

        // Прокрутка вниз после отправки
        setTimeout(() => {
            scrollToBottom();
        }, 100);
    };

    const handleFileUploaded = (url: string) => {
    if (!chat_id || !UserInfo) return;
        console.log(url)
    const fileMessage = {
      id: chat_id,
      data: {
        content: { url  },
        reply_to_id: null,
        username: UserInfo.username,
        user_id: UserInfo.id,
        chat_id: chat_id,
      }
    };

    dispatch(sendMessageVisual({
      id: Date.now(),
      content: [{ type:"url", text: url }],
      username: UserInfo.username,
      user_id: UserInfo.id,
      is_edited: false,
      timestamp: new Date().toLocaleTimeString(),
    }));

    sendMessage(fileMessage);
  };

    useEffect(() => {
        if (activeChat) {
            setTimeout(() => {
                getMessages(activeChat.chat_id);
            }, 6000);
        }
    }, [data]);
    return (
        <div className="chat-input">
            <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                onKeyPress={(e) => e.key === "Enter" && handleClick()}
            />
            {/* {uploaded &&
            <ul className="upload-menu">
                    <li>
                        <button className="photo">
                            Photo/Video
                        </button>
                        </li>
                    <li>
                        <button className="document">
                            Document
                        </button>
                    </li>
                    <li>
                        <button className="file">
                            Any file
                        </button>
                    </li>
                </ul>} */}
            
            
            <FileUploader onUploaded={handleFileUploaded} />
            
            <button onClick={handleClick} className="enter-message">
                <svg width="37" height="36" viewBox="0 0 37 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2.9408 2.14745L34.6459 18L2.9407 33.8526C2.50493 34.0705 2.04665 33.6 2.27591 33.1701L9.48824 19.6468C10.0373 18.6174 10.0372 17.3821 9.48823 16.3527L2.27601 2.82996C2.04674 2.40007 2.50504 1.92957 2.9408 2.14745Z" stroke="#FFF" strokeWidth="1.25"/>
                </svg>
            </button>
        </div>
    );
};

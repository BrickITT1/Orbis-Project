import React, { useEffect, useRef, useState } from "react";
import { Message } from "../../types/Message";
import { useAppDispatch } from "../../app/hooks";
import { setOpenMessage } from "../../features/chat/chatSlices";
import { config } from "../../config";

interface SingleMessageProps {
  message: Message;
}

export const SingleMessage: React.FC<SingleMessageProps> = ({ message }) => {

  const dispatch= useAppDispatch();

  const [hoveredMessageData, setHoveredMessageData] = useState<Message | null>(null);


  const handleMouseEnter = () => {
    setHoveredMessageData(message);
    dispatch(setOpenMessage(message))
  };

  const handleMouseLeave = () => {
    setHoveredMessageData(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  };
  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        className={message.id == hoveredMessageData?.id ? "message-container message-active": "message-container"}
      >
        <div className="avatar">
          <img
            src="/img/icon.png"
            alt={`Аватар ${message.username}`}
            width={50}
            height={50}
          />
        </div>
        <div className="content">
          <h3 className="username">
            {message.username}
            <span className="message-time"> {message.timestamp.slice(0, 5)}</span>
          </h3>
          {message.content?.map((val) => (
            <div className="text" key={`message-text-${val.id}`}>
              
              {val.type == "url" ? (<>{
                val.text.match(/\.(jpeg|jpg|png|gif)$/)  ?
                  <div><img src={val.text} alt="notloaded" style={{maxWidth: "700px"}} /></div> : (
          <>{ val.text.split("/")[val.text.split("/").length - 1]}  <a href={`${config.cdnServiceUrl}/download?url=${encodeURIComponent(val.text)}`} target="_blank" rel="noreferrer" >Скачать файл</a></>
        )
              }</>) : val.text}
            </div>
            
          ))}
        </div>
      </div>

      
    </>
  );
};

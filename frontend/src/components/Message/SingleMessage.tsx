import React, { useMemo } from "react";
import { Message } from "../../types/Message";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setOpenMessage } from "../../features/chat/chatSlices";
import { makeSelectIsMessageOpen } from "../../features/chat/chatSelectors";
import { config } from "../../config";

interface SingleMessageProps {
  message: Message;
  onClick?: (e: React.MouseEvent) => void;
}

const SingleMessageComponent: React.FC<SingleMessageProps> = ({ message, onClick }) => {
  

  // мемоизированный селектор для определения, открыт ли message
  const selectIsOpen = useMemo(() => makeSelectIsMessageOpen(String(message.id)), [message.id]);
  const isOpen = useAppSelector(selectIsOpen);

  // const handleContextMenu = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
  //   e.preventDefault();
  //   dispatch(setOpenMessage(message));
  // };

  return (
    <div
      onContextMenu={onClick}
      className={isOpen ? "message-container message-active" : "message-container"}
    >
      <div className="avatar">
        <img
          src="/img/icon.png"
          alt={`Аватар ${message.username}`}
          width={50}
          height={50}
        />
      </div>
      <div className="content" >
        <h3 className="username">
          {message.username}
          <span className="message-time"> {message.timestamp.slice(0, 5)}</span>
        </h3>
        {message.content?.map((val) => (
          <div className="text" key={`message-text-${val.id}`}>
            {val.type === "url" ? (
              val.text.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                <div>
                  <img src={val.text} alt="image" style={{ maxWidth: "700px" }} />
                </div>
              ) : (
                <>
                  {val.text.split("/").pop()}{" "}
                  <a
                    href={`${config.cdnServiceUrl}/download?url=${encodeURIComponent(val.text)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Скачать файл
                  </a>
                </>
              )
            ) : (
              val.text
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// мемоизация компонента
export const SingleMessage = React.memo(
  SingleMessageComponent,
  (prevProps, nextProps) => prevProps.message === nextProps.message
);

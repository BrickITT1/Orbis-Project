import React, { useMemo } from "react";
import { Message, SingleMessageProps } from "../types/chat.types";
import { useAppSelector } from "@/app/hooks";
import { makeSelectIsMessageOpen } from "../chatSelector";
import { config } from "@/config";


const SingleMessageComponent: React.FC<SingleMessageProps> = ({ message, onClick }) => {
  const selectIsOpen = useMemo(() => makeSelectIsMessageOpen(String(message.id)), [message.id]);
  const isOpen = useAppSelector(selectIsOpen);
  return (
    <div
      onContextMenu={onClick}
      
      className={isOpen ? " bg-[#7895f3] flex gap-5 lg:gap-3" : "flex gap-5 lg:gap-3 "}
    >
      <div className=" self-start p-1">
        <img
          src="/img/icon.png"
          alt={`Аватар ${message.username}`}
          className="w-20 h-20 lg:w-10 lg:h-10"
        />
      </div>
      <div className="" >
        <h3 className="text-3xl lg:text-base">
          {message.username}
          <span className="text-2xl lg:text-base"> {message.timestamp.slice(0, 4)}</span>
        </h3>
        {message.content?.map((val) => (
          <div className="text-3xl lg:text-base" key={`message-text-${val.id}`}>
            {val.type === "url" ? (
              val.text.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                <div>
                  <img src={val.url} alt="image" style={{ maxWidth: "700px" }} />
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

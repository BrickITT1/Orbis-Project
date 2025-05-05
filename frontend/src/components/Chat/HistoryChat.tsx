import React, { useRef, useState } from "react";
import { Message } from "../../types/Message";
import { SingleMessage } from "../Message/SingleMessage";
import { MessageGroup } from "../Message/MessageGroup";

export const HistoryChat: React.FC<{
    groupMessage:
        | {
              messages: Message[];
              user_id: number;
              user_name: string;
              minute: string;
          }[]
        | null;
}> = ({ groupMessage }) => {
    return (
        <div className="messages">
            {groupMessage?.map((group, idx) =>
                group.messages.length === 1 ? (
                    <SingleMessage
                        key={`single-${group.messages[0].id}-${idx}`}
                        message={group.messages[0]}
                    />
                ) : (
                    <MessageGroup
                        key={`group-${group.user_id}-${group.minute}-${idx}`}
                        group={group}
                    />
                ),
            )}
        </div>
    );
};

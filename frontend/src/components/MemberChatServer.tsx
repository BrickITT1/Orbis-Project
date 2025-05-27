import React, { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useLazyGetInfoUserQuery } from "../services/user";
import { useLazyGetServersMembersQuery } from "../services/server";

export const MemberChatServer: React.FC = () => {

    const dispatch = useAppDispatch();
    const membersServer = useAppSelector(s => s.server.activeserver?.users);
    const activeserver = useAppSelector(s => s.server.activeserver?.id);
    const chatinfo = useAppSelector(s => s.chat.activeChat);

    const [trigger, { data, isFetching, error }] = useLazyGetInfoUserQuery();

    if (!membersServer && !chatinfo?.users) return null;

    const users = activeserver ? membersServer : chatinfo?.users;
    const handleClick = (id: number) => {
        trigger(id); // Выполняем запрос с конкретным ID
    };


    return (
        <>
            <div className="user-view">
                <h2>Участники: {users?.length}</h2>
                {users?.map((val: any, idx: number) => (
                    <button key={`${idx}-member-server`} onClick={() => handleClick(val.id)}>
                        <img src="/img/icon.png" alt="" />{val.username}
                    </button>
                ))}
            </div>
        </>
    );
};

import React, { useEffect, useState, useRef } from "react";
import { ModalLayout } from "../../Layouts/Modal/Modal";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { finallyCreateServer } from "../../../features/server/serverSlices";
import { useCreateSeverMutation, useJoinServerMutation, useLazyGetServersQuery } from "../../../services/server";

export const AddServerForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const check = useAppSelector(s => s.server.isCreatingServer);
    const [createServer, {isLoading, isError, isSuccess: successCreate}] = useCreateSeverMutation();
    const [joinServer, {isSuccess: successJoin}] = useJoinServerMutation();
    const [nameServer, setNameServer] = useState<string>();
    const [idServer, setIdServer] = useState<string>();
    const [trigger, { data, isFetching, error }] = useLazyGetServersQuery();

    const createServerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (createServerRef.current && !createServerRef.current.contains(event.target as Node)) {
                // Клик вне блока .profile
                dispatch(finallyCreateServer()); // закрытие профиля или нужное действие
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dispatch]);

    useEffect(()=>{
        trigger({})
    }, [successCreate, successJoin])

    const createrServerHandler = async() => {
        if (!nameServer) return;
        if (nameServer?.length < 6) return;
        try {
            const newServer = {
                name: nameServer,
            }
            await createServer(newServer);
            
        } catch (err) {
            console.log(err)
        } finally {
            dispatch(finallyCreateServer());
        }
    };

    const joinServerHandler = async() => {
        if (!idServer) return;
        try {
            
            await joinServer(idServer);
        } catch (err) {
            console.log(err)
        } finally {
            dispatch(finallyCreateServer());
        }
    }
    

    if (!check) return null

    return (
        <ModalLayout> 
            <div className="connect-server create-server-form" ref={createServerRef}>
                <h2>Creating a server</h2>
                <p>The server is a place where you can spend time with friends</p>
                <input type="text" placeholder="Enter server name" name="servername" value={nameServer} onChange={(e) => {
                    if (e.target.value) {
                        setNameServer(e.target.value);
                    }
                    
                }} />
                <button onClick={() =>createrServerHandler()}>Create</button>
                <p>You can also join by id</p>
                <input type="text" placeholder="Enter server id" name="serverid" value={idServer} onChange={(e) => {setIdServer(e.target.value)}} />
                <button onClick={() => joinServerHandler()}>Connect</button>
            </div>
        </ModalLayout>
        
    );
};

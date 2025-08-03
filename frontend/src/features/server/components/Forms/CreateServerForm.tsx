import React, { useEffect, useState, useRef } from "react";
import { ModalLayout } from "@/components/layout/Modal/Modal";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { finallyCreateServer } from "../../serverSlices";
import { useCreateSeverMutation, useJoinServerMutation, useLazyGetServersQuery } from "../../api/serverApi";
import { ModalButton } from "@/components/ui/Button/ModalButton";
import { ModalInput } from "@/components/ui/Input/ModalInput";

const AddServerForm: React.FC = () => {
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
            <div className="p-10 text-white flex flex-col gap-3 w-full" ref={createServerRef}>
                <h2 className="text-2xl text-center bg-[#1a40eb]">Creating a server</h2>
                <p className="bg-[#1a40eb]">The server is a place where you can spend time with friends</p>
                <ModalInput 
                    placeHolder="Enter server name" 
                    name="servername" 
                    value={nameServer || ""}
                    change={(e) => setNameServer((e.target as HTMLInputElement).value)}
                />
                <ModalButton handler={() =>createrServerHandler()}>Create</ModalButton>
                <p>You can also join by id</p>
                <ModalInput 
                    placeHolder="Enter server id" 
                    name="serverid" 
                    value={idServer || ""} 
                    change={(e) => {setIdServer((e.target as HTMLInputElement).value)}} />
                <ModalButton handler={() => joinServerHandler()}>Connect</ModalButton>
            </div>
        </ModalLayout>
        
    );
};

export default AddServerForm;

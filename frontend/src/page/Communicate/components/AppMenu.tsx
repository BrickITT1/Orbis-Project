import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useServerJournalContext } from "@/contexts/ServerJournalSocketContext";
import { setActivePersonalCommunicate } from "@/features/action";
import { useLogoutUserMutation } from "@/features/auth";
import { setActiveChat } from "@/features/chat";
import { initCreateServer, setActiveServer, useGetServersQuery, useLazyGetServersInsideQuery } from "@/features/server";
import { CirclePlus, LogOut, Menu, Settings } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


export const AppMenu: React.FC = () => {
    const [avatarUrl, setAvatarUrl] = useState<string>();
    const [logout] = useLogoutUserMutation();
    const {} = useGetServersQuery({});
    const dispatch = useAppDispatch();
    const navigator = useNavigate();
    const server = useAppSelector((state) => state.server);
    const {socket} = useServerJournalContext();
    const [getInside] = useLazyGetServersInsideQuery();
    const isPersonalMessageMenu = useAppSelector((s)=>s.action.isPersonalCommunicateActive)

    // useEffect(()=> {
    //     dispatch(setActiveChat(undefined))
        
    // }, [server.activeserver, ])

    
    return (
        <>
            <div className="order-10 lg:order-0 w-full flex lg:w-fit lg:flex-col justify-between items-center lg:h-full bg-[rgba(86,82,209,0.5)] p-3 pt-5 pb-5 relative">
                <div className="flex lg:flex-col gap-5">
                    <div className="">
                        <button
                            onClick={() => {
                                dispatch(setActivePersonalCommunicate(!isPersonalMessageMenu));
                            }}
                            className="cursor-pointer"
                            >
                                        
                            <Menu className="w-15 h-15 lg:w-10 lg:h-10" color="white" strokeWidth={1.25}/>
                        </button>
                </div>
                <div className="">
                    <button
                        onClick={() => {
                            dispatch(setActiveServer(undefined));
                        }}
                        className="cursor-pointer"
                        >
                                    
                    {avatarUrl ? null : (
                        <>
                            <img src="/img/icon.png" alt="" className="w-15 h-15 lg:w-10 lg:h-10"/>
                        </>
                    )}
                    </button>
                </div>
                <div className="flex gap-2 flex-col justify-center">
                    
                    {server.servers &&
                        server.servers.map((val, index) => (
                            <div
                                className="flex w-10 h-10"
                                key={`server-${val.id}`}
                            >
                                <button
                                    onClick={async() => {
                                        if (server.activeserver?.id == val.id) return;
                                        socket?.emit('leave-server', server.activeserver?.id);
                                        dispatch(setActiveServer(val));
                                        
                                        socket?.emit('join-server', val.id)
                                    }}
                                    className="flex justify-center items-center cursor-pointer hover:brightness-90 transition  overflow-hidden box-border text-white rounded-full bg-[#405fc5] w-full h-full text-center p-3"
                                >
                                    {val.name.slice(0, 1)}
                                </button>
                            </div>
                        ))}

                        <button onClick={() => {
                            dispatch(initCreateServer());
                        }}>
                            <CirclePlus color="#fff" strokeWidth={1.25} className="w-15 h-15 lg:w-10 lg:h-10"/>
                        </button>
                </div>
                </div>
                <div className="flex lg:block">

                    
                    
                    <div className="exit settings">
                        <button className="" onClick={() => {
                            navigator("/app/settings")
                        }}>
                            <Settings color="#fff" strokeWidth={1.25} className="w-15 h-15 lg:w-10 lg:h-10"/>

                        </button>
                    </div>

                    
                </div>
                
            </div>
        </>
    );
};

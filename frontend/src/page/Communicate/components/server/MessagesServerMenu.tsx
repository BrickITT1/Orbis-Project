import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { chat, setActiveChat } from "@/features/chat";
import { setStatus, useConnectToVoiceRoom, useJoinVoiceRoom, useLazyGetPeersInRoomQuery, useLeaveRoom, VoiceComponets } from "@/features/voice";
import { useGetChatsUsersQuery } from "@/features/user";
import { ServerItem } from "./ServerItem";
import { useNavigate } from "react-router-dom";
import { useCreateChatMutation, useCreateVoiceMutation, useLazyGetServersInsideQuery, voice } from "@/features/server";
import { useServerJournalContext } from "@/contexts/ServerJournalSocketContext";
import { addAction } from "@/features/action";

export const MessageServerMenu: React.FC = () => {
    const activeServer = useAppSelector((state) => state.server.activeserver);
    const dispatch = useAppDispatch();
    const {} = useGetChatsUsersQuery({});
    const navigator = useNavigate();
    const authInfo = useAppSelector(s => s.auth.user?.info);
    const join = useJoinVoiceRoom();
    const statusVoice = useAppSelector(s => s.voice.status);
    const isConnection = (statusVoice == "connected");
    const voiceState = useAppSelector((state) => state.voice);
    const [getPeers] = useLazyGetPeersInRoomQuery();
    const roomPeers = useAppSelector((s) => s.voice.roomPeers);
    const connectStatus = useConnectToVoiceRoom();
    const leaveStatus = useLeaveRoom();
    const {socket} = useServerJournalContext();
    const [trigger] = useLazyGetServersInsideQuery();
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [createVoice, {isSuccess: succVoice}] = useCreateVoiceMutation();
    const [createText, {isSuccess: succText}] = useCreateChatMutation();
   

    if (!activeServer) {
        navigator("/app")
    }


    useEffect(()=> {
        if (!socket) return
        if (!activeServer?.id) return

        const updateServer = () => {
            trigger(activeServer?.id);
            
            dispatch(addAction({id: Date.now() ,type: 'SUCCESS', text:'Success updated', duration: 3000}))
        }

        socket.on('update-into-server', updateServer)
        return () => {
            socket.off('update-into-server', updateServer)
        }
    }, [socket, activeServer?.id, ])

    const joinVoiceRoom = async (id: number) => {
        if (!authInfo) return;

        const roomId = `server-${activeServer?.id}-${id}`;
        
        const success = join(roomId); // вызов useJoinVoiceRoom
        
        if (!success) {
            console.error("Не удалось инициировать данные для подключения к голосовой комнате");
            return;
        }

        // Хук useConnectToVoiceRoom выполнит подключение сам (у тебя он срабатывает по useEffect)
        dispatch(setStatus('needconn'));

    };

    useEffect(() => {
        if (!voiceState.roomId) return;
        getPeers(voiceState.roomId);
    }, [voiceState.roomId]);

     const handleOptionClick = (option: string) => {
        console.log(`Вы выбрали: ${option}`);
        setMenuVisible(false); // Скрыть меню после клика
    };

    const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
        if (e.target !== e.currentTarget) return; // Игнорируем дочерние элементы

        e.preventDefault();
        setMenuPosition({ x: e.pageX, y: e.pageY });
        setMenuVisible(true);
    };


    return (
        <>
            {activeServer && 
            <div className="flex flex-col bg-[rgba(81,110,204,0.12)] p-5 gap-5 justify-between h-full min-w-[250px] max-w-[250px]">
                <h2 className="text-white text-2xl">{activeServer?.name}</h2>
                <div className="flex flex-col gap-5 h-full">
                
                
                    <ul className="flex flex-col gap-2 h-full  text-white" onContextMenu={handleContextMenu}>
                        {activeServer.chats && activeServer.chats.length > 0 &&
                            activeServer.chats.map((val: chat, index: number) => (
                                <ServerItem key={`${index}-chat-server-${val.id}`} chat={val} />
                            ))}
                        {activeServer.voices && activeServer.voices.length > 0 &&
                            activeServer.voices.map((val: voice, index: number) => (
                                <li key={`${index}-voice-server-${val.id}`} className="bg-[#2236ec4f]">
                                    
                                    <button
                                        className="flex bg-transparent w-full items-center p-2 rounded-[5px] cursor-pointer"
                                        onClick={()=>joinVoiceRoom(val.id)}
                                            
                                    >
                                        
                                        {val.name}
                                    </button>
                                    {voiceState.roomId === `server-${activeServer?.id}-${val.id}` && (
                                        <ul className="bg-[#2236ec4f] p-2 flex flex-col gap-2">
                                            {voiceState.roomPeers.map(
                                                peer=>
                                                (<li key={`${activeServer?.id}-${val.id}-${peer.peerId}`} className="flex gap-3 truncate select-none cursor-pointer"><img src="img/icon.png" width={25} alt="" />{peer.username}</li >))}
                                        </ul>
                                    )}
                                    
                                </li>
                                    
                            ))}
                    </ul>
                    
                </div>
                 {menuVisible && (
                        <ul
                            className="absolute bg-[#2550dd] "
                            style={{
                            top: menuPosition.y,
                            left: menuPosition.x,
                            }}
                            onContextMenu={(e) => e.preventDefault()} // отключаем контекстное меню внутри
                        >
                            <li
                            className="p-2"
                            onClick={() => {
                                if (!socket) return
                                createVoice({id: activeServer?.id})
                                socket.emit('update-into-server', 'update-server-active', activeServer?.id);
                            }}
                            >
                            Create voice chat
                            </li>
                            <li
                            className="p-2"
                            onClick={() => {
                                if (!socket) return
                                createText({id: activeServer?.id});
                                socket.emit('update-into-server', 'update-server-active',  activeServer?.id);
                        }}
                            >
                            Create text chat
                            </li>
                            <li
                                className="p-2"
                                onClick={() => handleOptionClick("Опция 3")}
                            >
                            Invite 
                            </li>
                        </ul>
                        )}
                

                <div className="personal-manager">
                        <VoiceComponets.VoiceManager />
                </div>  
            </div>
            }
            
        </>
    );
};

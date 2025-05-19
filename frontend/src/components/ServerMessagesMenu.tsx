import React, { useEffect, useRef, useState } from "react";
import { ChatItem } from "./Message/ChatItem";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { MessageMenuLayout } from "./Message/MessageMenuLayout";
import { useNavigate } from "react-router-dom";
import { useCreateChatMutation, useCreateVoiceMutation, useGetServersInsideQuery, useLazyGetServersInsideQuery } from "../services/server";
import { chat } from "../features/chat/chatSlices";
import { voice } from "../features/server/serverSlices";
import { useVoiceChat } from "../app/hook/voicechat/useVoiceChat";
import AudioManager from "./Voice/AudioManager";
import { setToggleJoin } from "../features/voice/voiceSlices";
import { VoiceManager } from "./Voice/VoiceManager";



export const MessageMenuServer: React.FC = () => {
    const dispatch = useAppDispatch();
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const menuRef = useRef(null);
    const targetRef = useRef<HTMLUListElement>(null);
    const activeServer = useAppSelector((state) => state.server.activeserver);
    const [createVoice, {isSuccess: succVoice}] = useCreateVoiceMutation();
    const [createText, {isSuccess: succText}] = useCreateChatMutation();
    const [trigger] = useLazyGetServersInsideQuery();

    const { data, isLoading, isFetching, isError } = useGetServersInsideQuery(
        activeServer?.id,
    );
    const voiceState = useAppSelector((state) => state.voice);
    const navigator = useNavigate();

    const { streams, roomPeers, localPeerId } =
        useVoiceChat();

    const handleContextMenu = (e: React.MouseEvent<HTMLElement>) => {
        if (e.target !== e.currentTarget) return; // Игнорируем дочерние элементы

        e.preventDefault();
        setMenuPosition({ x: e.pageX, y: e.pageY });
        setMenuVisible(true);
    };

    const handleClick = () => {
        setMenuVisible(false);
    };

    useEffect(() => {
        const handleGlobalClick = () => setMenuVisible(false);

        const handleGlobalContextMenu = (event: MouseEvent) => {
        // если клик вне блока — скрыть меню
        if (
            targetRef.current &&
            !targetRef.current.contains(event.target as Node)
        ) {
            setMenuVisible(false);
        }
        };

        document.addEventListener("click", handleGlobalClick);
        document.addEventListener("contextmenu", handleGlobalContextMenu);

        return () => {
            document.removeEventListener("click", handleGlobalClick);
            document.removeEventListener("contextmenu", handleGlobalContextMenu);
        };
  }, []);

    useEffect(() => {
        if (!activeServer) return;
        trigger(activeServer?.id);
    }, [succText, succVoice])

    useEffect(() => {
        if (!activeServer) {
            navigator("/app/");
        }
    }, []);

    const handleOptionClick = (option: string) => {
        console.log(`Вы выбрали: ${option}`);
        setMenuVisible(false); // Скрыть меню после клика
    };

    

    if (isFetching) {
        return <MessageMenuLayout>&nbsp;</MessageMenuLayout>;
    }

    if (isLoading) {
        return <MessageMenuLayout>&nbsp;</MessageMenuLayout>;
    }

    if (isError) {
        return <MessageMenuLayout>&nbsp;</MessageMenuLayout>;
    }

    const joinVoiceRoom = (voiceId: number) => {
        if (!activeServer) return
        dispatch(setToggleJoin({isConnected: true, roomId: voiceId}))
    }
    

    return (
        <>
            <MessageMenuLayout>
                
                <h2>{data?.name}</h2>
                <div className="bg-server"></div>
                <ul ref={targetRef} className="server-list" onContextMenu={handleContextMenu} >
                    
                    {data &&
                        data.chats.map((val: chat, index: number) => (
                            <ChatItem key={`${index}-chat-server`} chat={val} />
                        ))}

                    {data &&
                        data.voices.map((val: voice, index: number) => (
                            <li className="voice" key={`${index}-voice-server`}>
                                <div className="">
                                <button
                                onClick={() => {
                                    try {
                                        joinVoiceRoom(val.id);
                                    } catch (error) {
                                        console.error('Join room error:', error);
                                    }
                                }} 
                                disabled={voiceState.isConnected}>
                                
                                    <span>#</span> {val.name}
                                </button>
                                <ul className="in-voice">
                                {voiceState.roomId == val.id && roomPeers.map(peer => (
                                    <li key={peer.id}>
                                        <span><img src="/img/icon.png" alt="" width={"30px"} height={"30px"} /></span>
                                        {peer?.username}
                                    </li>
                                                
                                        ))}
                                </ul>
                                </div>
                            </li>
                        ))}
                    {streams.audioStreams && localPeerId ? <AudioManager
                        audioStreams={streams.audioStreams}
                        localPeerId={localPeerId}
                    />: null} 
                    {menuVisible && (
                        <ul
                            className="manage-server-menu"
                            style={{
                            top: menuPosition.y,
                            left: menuPosition.x,
                            }}
                            onContextMenu={(e) => e.preventDefault()} // отключаем контекстное меню внутри
                        >
                            <li
                            className="manage-server-item"
                            onClick={() => {
                                createVoice({id: activeServer?.id})
                            }}
                            >
                            Create voice chat
                            </li>
                            <li
                            className="manage-server-item"
                            onClick={() => createText({id: activeServer?.id})}
                            >
                            Create text chat
                            </li>
                            <li
                                className="manage-server-item"
                                onClick={() => handleOptionClick("Опция 3")}
                            >
                            Invite 
                            </li>
                        </ul>
                        )}
                </ul>
                <VoiceManager />
            </MessageMenuLayout>
        </>
    );
};

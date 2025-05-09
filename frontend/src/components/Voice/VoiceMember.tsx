import React, { useEffect, useRef, useState } from "react";
import { PeerInfo } from "../../types/Channel";
import { useAppSelector } from "../../app/hooks";

type TypeMember = "chat" | "server";

interface VoiceMemberProps {
    typeMember: TypeMember;
    videoStreams: Record<string, MediaStream>;
}

export const VoiceMember: React.FC<VoiceMemberProps> = ({
    typeMember,
    videoStreams,
}) => {
    const isConnected = useAppSelector((s) => s.voice.isConnected);
    const myPeer = useAppSelector((s) => s.voice.myPeer);
    const roomPeers = useAppSelector((s) => s.voice.roomPeers);
    const audioOnly = myPeer?.audioOnly ?? false;
    const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
    const localStreamRef = useRef<MediaStream | null>(null);

    const [isStreamInitialized, setIsStreamInitialized] = useState(false);

    // Функция для остановки потока
    const stopStream = (stream: MediaStream | null) => {
        stream?.getTracks().forEach((track) => track.stop());
    };

    // Очистка потоков при размонтировании
    useEffect(() => {
        return () => {
            Object.values(videoRefs.current).forEach((videoEl) => {
                if (videoEl?.srcObject) {
                    stopStream(videoEl.srcObject as MediaStream);
                }
            });
            stopStream(localStreamRef.current);
        };
    }, []);

    // Функция для создания локального потока
    const createLocalStream = async () => {
        if (typeMember !== "chat" || !myPeer.id) return;

        if (!localStreamRef.current) {
            try {
                console.log("Запрос на доступ к камере...");
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
                localStreamRef.current = stream;
                const videoEl = videoRefs.current[myPeer.id];
                if (videoEl) {
                    videoEl.srcObject = stream;
                }
                setIsStreamInitialized(true);
            } catch (err) {
                console.error("Ошибка доступа к камере:", err);
                alert("Не удалось получить доступ к камере. Пожалуйста, проверьте разрешения.");
            }
        }
    };

    // Эффект для создания локального потока при изменении состояния
    useEffect(() => {
        if (myPeer.id && isConnected && !isStreamInitialized) {
            createLocalStream();
        }
        
        return () => {
            stopStream(localStreamRef.current);
            localStreamRef.current = null;
        };
    }, [myPeer.id, isConnected, isStreamInitialized, typeMember]); // Убедимся, что поток создается только после того, как все данные готовы

    // Обновление видеопотоков для других участников
    useEffect(() => {
        if (typeMember !== "chat") return;

        roomPeers.forEach((peer) => {
            if (peer.id === myPeer.id) return; // Пропускаем себя

            const streamKey = Object.keys(videoStreams).find((key) =>
                key.startsWith(`${peer.id}-`),
            );
            const stream = streamKey ? videoStreams[streamKey] : null;
            const videoEl = videoRefs.current[peer.id];

            if (videoEl && stream) {
                videoEl.srcObject = stream;
            } else if (videoEl?.srcObject) {
                stopStream(videoEl.srcObject as MediaStream);
                videoEl.srcObject = null;
            }
        });
    }, [videoStreams, roomPeers, myPeer.id, typeMember]);

    if (!roomPeers.length) {
        return <div>Loading...</div>;
    }

    if (typeMember === "server") {
        return (
            <ul>
                {roomPeers.map((peer) => (
                    <li key={peer.id}>
                        <span>
                            <img
                                src="/img/icon.png"
                                alt=""
                                width={30}
                                height={30}
                            />
                        </span>
                        {peer.username}
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <ul>
            {roomPeers.map((peer) => {
                const isMe = peer.id === myPeer.id;
                const showAvatar =
                    peer.audioOnly ||
                    (isMe
                        ? audioOnly
                        : !Object.keys(videoStreams).some(
                              (key) => key.startsWith(`${peer.id}-`),
                        ));

                return (
                    <li key={peer.id}>
                        <div className="voice-avatar">
                            {showAvatar ? (
                                <img
                                    src="/img/icon.png"
                                    alt={`Аватар ${peer.username}`}
                                    width={150}
                                    height={150}
                                />
                            ) : (
                                <video
                                    ref={(el) =>
                                        (videoRefs.current[peer.id] = el)
                                    }
                                    autoPlay
                                    muted={isMe}
                                    playsInline
                                    style={{
                                        width: 200,
                                        height: "auto",
                                        borderRadius: 8,
                                        margin: "10px 0",
                                    }}
                                />
                            )}
                        </div>
                        <div className="voice-name">
                            {peer.username} {peer.muted && "(muted)"}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

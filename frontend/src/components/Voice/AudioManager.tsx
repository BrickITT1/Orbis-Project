import React, { useRef, useCallback, useEffect, useMemo } from "react";
import { useAppSelector } from "../../app/hooks";

interface AudioManagerProps {
    audioStreams: Record<string, MediaStream>;
    localPeerId: string;
    onPlaybackError?: (streamId: string, error: Error) => void;
}

const extractPeerId = (streamId: string) => {
    const match = streamId.match(/^(.*)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    return match ? match[1] : streamId; // если нет UUID, возвращает всё
};

const AudioManager: React.FC<AudioManagerProps> = ({
    audioStreams,
    localPeerId,
    onPlaybackError,
}) => {
    const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});
    const peers = useAppSelector(s => s.voice.roomPeers)
    
    // Отфильтровываем локальный поток
    const filteredAudioStreams = useMemo(() => {
        return Object.fromEntries(
            Object.entries(audioStreams).filter(
                ([streamId]) => streamId.split("-")[0] !== localPeerId,
            ),
        );
    }, [audioStreams, localPeerId]);

    const handleError = useCallback(
        (streamId: string, error: Error) => {
            console.warn(
                `Audio playback failed for stream ${streamId}:`,
                error,
            );

            onPlaybackError?.(streamId, error);
        },
        [onPlaybackError],
    );

    // Очистка при размонтировании
    useEffect(() => {
        return () => {
            Object.values(audioRefs.current).forEach((el) => {
                if (el) {
                    el.pause();
                    el.srcObject = null;
                }
            });
            audioRefs.current = {};
        };
    }, []);
    return (
        <>
        {peers && <>
            {Object.entries(filteredAudioStreams).map(([streamId, stream]) => {
                if (!peers || peers.length === 0) return;
                const matchedPeer = peers.find(val => extractPeerId(streamId) === val.id);
                const isMuted = matchedPeer?.muted ?? false;

                return (
                    <audio
                        key={streamId}
                        autoPlay
                        playsInline
                        ref={(el) => {
                            if (el) {
                                audioRefs.current[streamId] = el;
                                el.srcObject = stream;
                                el.muted = isMuted;
                                stream.getAudioTracks().forEach((track) => {
                                    track.enabled = !isMuted;
                                });
                                el.play().catch((err) =>
                                    handleError(streamId, err),
                                );
                            } else {
                                delete audioRefs.current[streamId];
                            }
                        }}
                        onError={() =>
                            handleError(
                                streamId,
                                new Error("Audio element error"),
                            )
                        }
                    />
                );
            })}</>}
            
        </>
    );
};

export default React.memo(AudioManager);

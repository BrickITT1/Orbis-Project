import React, { useRef, useCallback, useEffect } from "react";
import { useAppSelector } from "../../app/hooks";
import { useMediaStreamContext } from "../../contexts/MediaStreamContext";

const extractPeerId = (streamId: string) => {
    const match = streamId.match(/^(.*?)-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    return match ? match[1] : streamId;
};

const AudioManager: React.FC = () => {
    const { remoteStreams } = useMediaStreamContext();
    const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
    const peers = useAppSelector(state => state.voice.roomPeers);

    const handleError = useCallback((streamId: string, error: Error) => {
        console.warn(`Audio playback failed for stream ${streamId}:`, error);
    }, []);

    useEffect(() => {
        return () => {
            Object.values(audioRefs.current).forEach(el => {
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
            {Object.entries(remoteStreams).map(([peerId, stream]) => {
                const matchedPeer = peers.find(peer => peer.id === peerId);
                const isMuted = matchedPeer?.muted ?? false;

                return (
                    <audio
                        key={peerId}
                        autoPlay
                        playsInline
                        ref={el => {
                            if (el) {
                                audioRefs.current[peerId] = el;
                                el.srcObject = stream;
                                el.muted = isMuted;
                                stream.getAudioTracks().forEach(track => {
                                    track.enabled = !isMuted;
                                });
                                el.play().catch(err => handleError(peerId, err));
                            } else {
                                delete audioRefs.current[peerId];
                            }
                        }}
                        onError={() => handleError(peerId, new Error("Audio element error"))}
                    />
                );
            })}
        </>
    );
};

export default React.memo(AudioManager);

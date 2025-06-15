import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useVoiceSocketContext } from "../../../contexts/VoiceSocketContext";
import { debounce } from "lodash";
import { setPeers } from "../../../features/voice/voiceSlices";
import { useLazyGetPeersInRoomQuery } from "../../../services/voice";

export const useSocketHandlers = () => {
    const { socket } = useVoiceSocketContext();
    const dispatch = useAppDispatch
    const roomId = useAppSelector((s) => s.voice.roomId);
    const [getPeers, {data, isSuccess}] = useLazyGetPeersInRoomQuery();
    const roomIdRef = useRef(roomId);

    useEffect(() => {
        roomIdRef.current = roomId;
    }, [roomId]);

    const updatePeers = useCallback(async () => {
    if (!socket || !roomIdRef.current) return;
    try {
        await getPeers(roomIdRef.current);
        console.log("Fetched peers");
    } catch (err) {
        console.error("Failed to update peers:", err);
    }
    }, [socket]);
    
    const debouncedUpdatePeers = useMemo(() => debounce(updatePeers, 500, { leading: false, trailing: true }), [updatePeers]);

    useEffect(() => {
        if (!socket) return;
        const onNewPeer = () => {
            debouncedUpdatePeers();
        };
        const onPeerDisconnected = () => {
            debouncedUpdatePeers();
        }
        socket.on('newPeer', onNewPeer);
        socket.on('peerDisconnected', onPeerDisconnected)
        return () => {
            socket.off('newPeer', onNewPeer);
            socket.off('peerDisconnected', onPeerDisconnected);
            
            //socket.off('disconnect', onPeerDisconnected);
            debouncedUpdatePeers.cancel();
        };
    }, [socket])
}
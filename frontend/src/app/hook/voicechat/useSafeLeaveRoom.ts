import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks";
import {
    setChat,
    setToggleJoin,
    setPeers,
} from "../../../features/voice/voiceSlices";
import type { Socket } from "socket.io-client";
import type { Transport, Producer, Consumer } from "mediasoup-client/lib/types";

interface PeerInfo {
    id: string;
    username: string;
    audioOnly: boolean;
}

interface SafeLeaveParams {
    socket: Socket | null;
    consumersRef: React.MutableRefObject<Map<string, Consumer>>;
    audioProducerRef: React.MutableRefObject<Producer | null>;
    videoProducerRef: React.MutableRefObject<Producer | null>;
    sendTransportRef: React.MutableRefObject<Transport | null>;
    recvTransportRef: React.MutableRefObject<Transport | null>;
    deviceRef: React.MutableRefObject<any>;
    audioStreams: Record<string, MediaStream>;
    videoStreams?: Record<string, MediaStream>;
    setStreams: (streams: {
        audioStreams?: Record<string, MediaStream>;
        videoStreams?: Record<string, MediaStream>;
    }) => void;
}

export const useSafeLeaveRoom = ({
    socket,
    consumersRef,
    audioProducerRef,
    videoProducerRef,
    sendTransportRef,
    recvTransportRef,
    deviceRef,
    audioStreams,
    videoStreams = {},
    setStreams,
}: SafeLeaveParams) => {
    const isLeavingRef = useRef(false);
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const waitForSocketReady = useCallback(
        async (maxWait = 3000) => {
            if (!socket) return false;
            const interval = 100;
            const maxTries = Math.floor(maxWait / interval);
            let tries = 0;

            while (tries < maxTries && !socket.connected) {
                await new Promise((resolve) => setTimeout(resolve, interval));
                tries++;
            }

            return socket.connected;
        },
        [socket],
    );

    const cleanupMediaElements = useCallback(() => {
        // Clean up DOM media elements
        document
            .querySelectorAll('audio[id^="audio-"], video[id^="video-"]')
            .forEach((el) => {
                const mediaEl = el as HTMLMediaElement;
                const stream = mediaEl.srcObject as MediaStream | null;
                stream?.getTracks().forEach((t) => t.stop());
                mediaEl.remove();
            });
    }, []);

    const cleanupProducers = useCallback(async () => {
        // Close producers
        try {
            audioProducerRef.current?.close();
            videoProducerRef.current?.close();
        } finally {
            audioProducerRef.current = null;
            videoProducerRef.current = null;
        }
    }, [audioProducerRef, videoProducerRef]);

    const cleanupConsumers = useCallback(() => {
        // Close consumers
        consumersRef.current.forEach((consumer) => {
            try {
                consumer.close();
            } catch (error) {
                console.warn("Error closing consumer:", error);
            }
        });
        consumersRef.current.clear();
    }, [consumersRef]);

    const cleanupTransports = useCallback(() => {
        // Close transports
        try {
            sendTransportRef.current?.close();
            recvTransportRef.current?.close();
        } finally {
            sendTransportRef.current = null;
            recvTransportRef.current = null;
        }
    }, [sendTransportRef, recvTransportRef]);

    const cleanupStreams = useCallback(() => {
        // Stop all audio tracks
        Object.values(audioStreams).forEach((stream) => {
            stream.getTracks().forEach((track) => track.stop());
        });

        // Stop all video tracks if they exist
        Object.values(videoStreams).forEach((stream) => {
            stream.getTracks().forEach((track) => track.stop());
        });

        // Clear streams state
        setStreams({ audioStreams: {}, videoStreams: {} });
    }, [audioStreams, videoStreams, setStreams]);

    const notifyServer = useCallback(async () => {
        if (!socket) return;
        
        try {
            const ready = await waitForSocketReady();
            isLeavingRef.current = false;
            if (ready) {
                await socket.emitWithAck("leaveRoom");
            }
            
            
        } catch (error) {
            console.warn("Failed to notify server about leaving:", error);
            isLeavingRef.current = false;
        }
    }, [socket, waitForSocketReady]);
    
    const leaveRoom = useCallback(async () => {
        if (isLeavingRef.current) {
            console.warn("Already in the process of leaving the room");
            return;
        }
        if (!socket) {
            console.warn("Socket instance not available");
            return;
        }
        
        isLeavingRef.current = true;

        try {
            // Order of cleanup matters
            await cleanupProducers();
            
            cleanupConsumers();
            cleanupTransports();
            
            cleanupMediaElements();
            cleanupStreams();
            
            // Reset device
            deviceRef.current = null;

            // Notify server
            await notifyServer();
            
        } catch (error) {
            console.error("Error during room cleanup:", error);
            isLeavingRef.current = false;
        } finally {
            // Reset state
            dispatch(setPeers([]));
            isLeavingRef.current = false;
        }
    }, [
        socket,
        isLeavingRef,
        cleanupProducers,
        cleanupConsumers,
        cleanupTransports,
        cleanupMediaElements,
        cleanupStreams,
        deviceRef,
        notifyServer,
        dispatch,
    ]);
    return leaveRoom;
};

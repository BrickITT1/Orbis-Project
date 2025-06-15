import { useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../hooks";
import {
  setChat,
  setToggleJoin,
  setPeers,
  setAudioOnlyMyPeer,
} from "../../../features/voice/voiceSlices";
import type { Socket } from "socket.io-client";
import type { Transport, Producer, Consumer, Device } from "mediasoup-client/lib/types";
import { useMediaStreamContext } from "../../../contexts/MediaStreamContext";

interface SafeLeaveParams {
  socket: Socket | null;
  consumersRef: React.MutableRefObject<Map<string, Consumer>>;
  audioProducerRef: React.MutableRefObject<Producer | null>;
  videoProducerRef: React.MutableRefObject<Producer | null>;
  sendTransportRef: React.MutableRefObject<Transport | null>;
  recvTransportRef: React.MutableRefObject<Transport | null>;
  device: Device | null;
}

export const useSafeLeaveRoom = ({
  socket,
  consumersRef,
  audioProducerRef,
  videoProducerRef,
  sendTransportRef,
  recvTransportRef,
  device,
}: SafeLeaveParams) => {
  const isLeavingRef = useRef(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const {
    clearAllStreams,
    remoteAudioStreams,
    remoteVideoStreams,
    removeRemoteAudioStream,
    removeRemoteVideoStream,
  } = useMediaStreamContext();

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
    [socket]
  );

  const cleanupMediaElements = useCallback(() => {
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
    try {
      audioProducerRef.current?.close();
      videoProducerRef.current?.close();
    } finally {
      audioProducerRef.current = null;
      videoProducerRef.current = null;
    }
  }, [audioProducerRef, videoProducerRef]);

  const cleanupConsumers = useCallback(() => {
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
    try {
      sendTransportRef.current?.close();
      recvTransportRef.current?.close();
    } finally {
      sendTransportRef.current = null;
      recvTransportRef.current = null;
    }
  }, [sendTransportRef, recvTransportRef]);

  const cleanupStreams = useCallback(() => {
    Object.entries(remoteAudioStreams).forEach(([key, stream]) => {
  stream.getTracks().forEach(track => track.stop());
  removeRemoteAudioStream(key); // ✅ key: string
});


    Object.entries(remoteVideoStreams).forEach(([key, stream]) => {
  stream.getTracks().forEach(track => track.stop());
  removeRemoteVideoStream(key);
});

    // Альтернатива — если есть clearAllStreams():
    clearAllStreams();
  }, [remoteAudioStreams, remoteVideoStreams, removeRemoteAudioStream, removeRemoteVideoStream, clearAllStreams]);

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
      await cleanupProducers();
      cleanupConsumers();
      cleanupTransports();
      cleanupMediaElements();
      cleanupStreams();
        dispatch(setAudioOnlyMyPeer(true))
      device = null;

      await notifyServer();
    } catch (error) {
      console.error("Error during room cleanup:", error);
      isLeavingRef.current = false;
    } finally {
      dispatch(setPeers([]));
      isLeavingRef.current = false;
    }
  }, [
    socket,
    cleanupProducers,
    cleanupConsumers,
    cleanupTransports,
    cleanupMediaElements,
    cleanupStreams,
    notifyServer,
    device,
    dispatch,
  ]);

  return leaveRoom;
};

import { useCallback, useRef } from "react";
import { useVoiceSocketContext } from "../../../contexts/VoiceSocketContext";
import { useTransportContext } from "../../../contexts/TransportContext";
import { useMediaStreamContext } from "../../../contexts/MediaStreamContext";
import { Consumer } from "mediasoup-client/lib/Consumer";
import { useAppSelector } from "@/app/hooks";

export const useConsumeMedia = () => {
  const { socket } = useVoiceSocketContext();
  const roomId = useAppSelector((s) => s.voice.roomId); 
  const {
    recvTransportRef,
    consumersRef,
    deviceRef,
    activePeerOperations,
  } = useTransportContext();

  const mediaContext = useMediaStreamContext();
  const mediaContextRef = useRef(mediaContext);
  mediaContextRef.current = mediaContext;

  const consumeMedia = useCallback(
    async (peerId: string) => {
      if (!recvTransportRef.current || !socket?.id || peerId === socket.id) return;
      if (activePeerOperations.current.has(peerId)) return;
      activePeerOperations.current.add(peerId);

      try {
        console.log('start-consume')
        if (!deviceRef.current) return;
        console.log(123)
        const { producers } = await socket.emitWithAck("getPeerProducers", { peerId, roomId });

        const newConsumers = new Map<string, Consumer>();
        const audioToAdd: Record<string, MediaStream> = {};
        const videoToAdd: Record<string, MediaStream> = {};

        for (const producer of producers) {
          const consumerKey = `${peerId}-${producer.id}`;
          if (consumersRef.current.has(consumerKey)) {
            newConsumers.set(consumerKey, consumersRef.current.get(consumerKey)!);
            continue;
          }

          const response = await socket.emitWithAck("consume", {
            roomId: roomId,
            producerId: producer.id,
            rtpCapabilities: deviceRef.current.rtpCapabilities,
          });

          const consumer = await recvTransportRef.current.consume({
            id: response.id,
            producerId: response.producerId,
            kind: response.kind,
            rtpParameters: response.rtpParameters,
          });

          const clonedTrack = consumer.track.clone();
          const mediaStream = new MediaStream([clonedTrack]);

          if (response.kind === "audio") {
            audioToAdd[consumerKey] = mediaStream;
          } else {
            videoToAdd[consumerKey] = mediaStream;
          }

          newConsumers.set(consumerKey, consumer);
          await socket.emitWithAck("resumeConsumer", { consumerId: consumer.id });
        }

        // Удаление неактуальных стримов
        Object.entries(mediaContextRef.current.remoteAudioStreams).forEach(([key]) => {
          if (key.startsWith(`${peerId}-`) && !newConsumers.has(key)) {
            mediaContextRef.current.removeRemoteAudioStream(key);
          }
        });

        Object.entries(mediaContextRef.current.remoteVideoStreams).forEach(([key]) => {
          if (key.startsWith(`${peerId}-`) && !newConsumers.has(key)) {
            mediaContextRef.current.removeRemoteVideoStream(key);
          }
        });

        // Добавление новых стримов
        Object.entries(audioToAdd).forEach(([key, stream]) => mediaContextRef.current.addRemoteAudioStream(key, stream));
        Object.entries(videoToAdd).forEach(([key, stream]) => mediaContextRef.current.addRemoteVideoStream(key, stream));

        // Закрытие устаревших consumer-ов
        consumersRef.current.forEach((consumer, key) => {
          if (key.startsWith(`${peerId}-`) && !newConsumers.has(key)) {
            consumer.close();
            consumersRef.current.delete(key);
          }
        });

        // Добавление новых consumer-ов
        newConsumers.forEach((consumer, key) => {
          consumersRef.current.set(key, consumer);
        });
      } catch (error) {
        console.error("consumeMedia error:", error);
      } finally {
        console.log('end-consume')
        activePeerOperations.current.delete(peerId);
      }
    },
    [socket, roomId, recvTransportRef, consumersRef, deviceRef, activePeerOperations]
  );

  return consumeMedia;
};

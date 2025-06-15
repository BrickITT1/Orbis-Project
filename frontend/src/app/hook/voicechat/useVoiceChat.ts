import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Device } from "mediasoup-client";
import type {
    Transport,
    Consumer,
    Producer,
    TransportOptions,
} from "mediasoup-client/lib/types";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useSafeLeaveRoom } from "./useSafeLeaveRoom";
import {
    setPeers,
    resetVoiceState,
    setMyPeer,
    setAudioOnlyMyPeer,
} from "../../../features/voice/voiceSlices";
import { PeerInfo, ProducerInfo, ConsumerInfo } from "../../../types/Channel";
import { useVoiceSocketContext } from "../../../contexts/VoiceSocketContext";
import { debounce } from "lodash";
import { useMediaStreamContext } from "../../../contexts/MediaStreamContext";
import { useDeviceContext } from "../../../contexts/DeviceContext";


type SafeConsumer = Consumer & {
    on(
        event: "producerpause" | "producerresume",
        listener: () => void,
    ): SafeConsumer;
    producerPaused: boolean;
};

const stopTrackSafely = (track: MediaStreamTrack) => {
    track.dispatchEvent(new Event('ended'));
    setTimeout(() => track.stop(), 1000);
};

export const useVoiceChat = () => {
    const { socket } = useVoiceSocketContext();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const username = useAppSelector((s) => s.auth.user?.username);
    const roomPeers = useAppSelector((s) => s.voice.roomPeers);
    

    const audioOnly = useAppSelector(s => s.voice.myPeer.audioOnly);
    const muted = useAppSelector(s => s.voice.myPeer.muted);
    const isConnected = useAppSelector(s => s.voice.isConnected);
    const myRoom = useAppSelector(s => s.voice.roomId);

    const {
        localAudioRef,
        localVideoRef,
        remoteAudioStreams,
        remoteVideoStreams,
        removeRemoteAudioStream,
        removeRemoteVideoStream,
        addRemoteAudioStream,
        addRemoteVideoStream,
        addLocalAudioStream,
        addLocalVideoStream,
        clearAllStreams,
    } = useMediaStreamContext();


    const { device, initDevice } = useDeviceContext();
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const audioProducerRef = useRef<Producer | null>(null);
    const videoProducerRef = useRef<Producer | null>(null);

    const consumersRef = useRef<Map<string, Consumer>>(new Map());
    const prevRoomPeersRef = useRef<PeerInfo[]>([]);
    
    const activeOperations = useRef(new Set<symbol>());
    const isLeavingRef = useRef(false);
    const joiningRoomRef = useRef(false);
    const activePeerOperations = useRef(new Set<string>());

    const consumeMedia = useCallback(
    async (peerId: string) => {
    if (!recvTransportRef.current || !socket?.id || peerId === socket.id) return;
    if (activePeerOperations.current.has(peerId)) return;
    activePeerOperations.current.add(peerId);

    try {
      if (!device) return;
      const { producers } = await socket.emitWithAck('getPeerProducers', { peerId });
      console.log(producers);

      const newConsumers = new Map<string, Consumer>();
      const audioToAdd: Record<string, MediaStream> = {};
      const videoToAdd: Record<string, MediaStream> = {};

      for (const producer of producers) {
        const consumerKey = `${peerId}-${producer.id}`;
        if (consumersRef.current.has(consumerKey)) {
          newConsumers.set(consumerKey, consumersRef.current.get(consumerKey)!);
          continue;
        }

        const response = await socket.emitWithAck('consume', {
          producerId: producer.id,
          rtpCapabilities: device?.rtpCapabilities,
        });

        const consumer = await recvTransportRef.current!.consume({
          id: response.id,
          producerId: response.producerId,
          kind: response.kind,
          rtpParameters: response.rtpParameters,
        });

        const clonedTrack = consumer.track.clone();
        const mediaStream = new MediaStream([clonedTrack]);

        if (response.kind === "audio") {
          audioToAdd[consumerKey] = mediaStream;
        } else if (response.kind === "video") {
          videoToAdd[consumerKey] = mediaStream;
        }

        newConsumers.set(consumerKey, consumer);
        await socket.emitWithAck("resumeConsumer", { consumerId: consumer.id });
      }

      // Удаляем устаревшие потоки аудио
      Object.entries(remoteAudioStreams).forEach(([key]) => {
        if (key.startsWith(`${peerId}-`) && !newConsumers.has(key)) {
          removeRemoteAudioStream(key);
        }
      });

      // Удаляем устаревшие потоки видео
      Object.entries(remoteVideoStreams).forEach(([key]) => {
        if (key.startsWith(`${peerId}-`) && !newConsumers.has(key)) {
          removeRemoteVideoStream(key);
        }
      });

      // Добавляем новые аудио потоки
      Object.entries(audioToAdd).forEach(([key, stream]) => addRemoteAudioStream(key, stream));
      // Добавляем новые видео потоки
      Object.entries(videoToAdd).forEach(([key, stream]) => addRemoteVideoStream(key, stream));

      // Закрываем и удаляем старые consumer'ы
      consumersRef.current.forEach((consumer, key) => {
        if (key.startsWith(`${peerId}-`) && !newConsumers.has(key)) {
          consumer.close();
          consumersRef.current.delete(key);
        }
      });

      // Обновляем consumersRef новыми consumer'ами
      newConsumers.forEach((consumer, key) => {
        consumersRef.current.set(key, consumer);
      });
    } catch (error) {
      console.error("consumeMedia error:", error);
    } finally {
      activePeerOperations.current.delete(peerId);
    }
  },
  [
    socket,
    remoteAudioStreams,
    remoteVideoStreams,
    addRemoteAudioStream,
    addRemoteVideoStream,
    removeRemoteAudioStream,
    removeRemoteVideoStream,
  ]
    );

    const leaveRoom = useSafeLeaveRoom({
        socket,
        consumersRef,
        audioProducerRef,
        videoProducerRef,
        sendTransportRef,
        recvTransportRef,
        device,
    });

    const createProducer = async (
      kind: 'audio' | 'video',
      constraints: MediaStreamConstraints,
      appData: { mediaType: string }
    ) => {
      if (!sendTransportRef.current) {
        throw new Error('Send transport is not initialized');
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = kind === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0];

      const producer = await sendTransportRef.current.produce({
        track,
        appData,
      });
      console.log("PRODUCER CREATED", producer);

      return { producer, stream };
    };

    const connectToVoiceRoom = useCallback(async (roomId: number) => {
      if (!socket?.connected || !username) return false;
     

      try {
        const { rtpCapabilities } = await socket.emitWithAck('getRouterRtpCapabilities');
        await initDevice(rtpCapabilities);

        if (!device) return;

        const { error: joinError } = await socket.emitWithAck('joinRoom', {
          username,
          roomId,
          audioOnly,
        });
        if (joinError) throw new Error(joinError);

        const createTransport = async (sender: boolean, roomId:string) => {
          const res = await socket.emitWithAck('createWebRtcTransport', { sender, roomId });
          if (res.error) throw new Error(res.error);
          return res.transport;
        };

        const [sendParams, recvParams] = await Promise.all([
          createTransport(true),
          createTransport(false),
        ]);

        sendTransportRef.current = device.createSendTransport({
          ...sendParams,
          appData: { sender: true },
        });

        recvTransportRef.current = device.createRecvTransport({
          ...recvParams,
          appData: { sender: false },
        });

        const connectHandler = async (params: any, cb: any, eb: any, transport: Transport) => {
          try {
            await socket.emitWithAck('connectTransport', {
              
              transportId: transport.id,
              dtlsParameters: params.dtlsParameters,
            });
            cb();
          } catch (e: any) {
            eb(e);
          }
        };

        sendTransportRef.current.on('connect', (p, cb, eb) =>
          connectHandler(p, cb, eb, sendTransportRef.current!)
        );

        recvTransportRef.current.on('connect', (p, cb, eb) =>
          connectHandler(p, cb, eb, recvTransportRef.current!)
        );

        sendTransportRef.current.on('produce', async ({ kind, rtpParameters }, cb, eb) => {
          try {
            const { id } = await socket.emitWithAck('produce', { kind, rtpParameters });
            cb({ id });
          } catch (err: any) {
            eb(err);
          }
        });

        // --- AUDIO
        const { producer: audioProducer, stream: audioStream } = await createProducer(
          'audio',
          { audio: true, video: false },
          { mediaType: 'audio' }
        );
        audioProducerRef.current = audioProducer;
        addLocalAudioStream('local-audio', audioStream);

        // --- VIDEO (optional)
        if (!audioOnly) {
          const { producer: videoProducer, stream: videoStream } = await createProducer(
            'video',
            { video: true, audio: false },
            { mediaType: 'video' }
          );
          videoProducerRef.current = videoProducer;
          addLocalVideoStream('local-video', videoStream);
        }

        // --- Room state
        const [{ peers }, peer] = await Promise.all([
          socket.emitWithAck('getRoomPeers'),
          socket.emitWithAck('getMyPeer'),
        ]);

        dispatch(setPeers(peers));
        dispatch(setMyPeer(peer));
        return true;
      } catch (e) {
        console.error('connectToVoiceRoom error:', e);
        if (!isLeavingRef.current) {
          isLeavingRef.current = true;
          leaveRoom();
        }
        return false;
      }
    }, [
      socket,
      username,
      audioOnly,
      dispatch,
      leaveRoom,
      addLocalAudioStream,
      addLocalVideoStream,
    ]);


    const joinRoom = useCallback(
      async (roomId: number, attempt = 1): Promise<boolean> => {
        if (attempt > 5 || joiningRoomRef.current) return false;

        joiningRoomRef.current = true;
        const ok = await connectToVoiceRoom(roomId);
        joiningRoomRef.current = false;

        if (!ok) {
          await new Promise((res) => setTimeout(res, 1000));
          return joinRoom(roomId, attempt + 1);
        }
        return true;
      },
      [connectToVoiceRoom]
    );

    useEffect(() => {
      console.log("useEffect triggered. audioOnly =", audioOnly);
      if (!sendTransportRef.current || !socket || audioOnly === undefined) {
        console.log('Early return:', {
          sendTransport: !!sendTransportRef.current,
          socket: !!socket,
          audioOnly
        });
        return;
      }

      
      const handleAudioOnlyChange = async () => {
        try {
          const sendTransport = sendTransportRef.current;
          if (!sendTransport) return;
          
          if (audioOnly) {
            // Отключаем видео
            if (videoProducerRef.current) {
              await videoProducerRef.current.close();
              videoProducerRef.current = null;
            }

            // Останавливаем видео-треки и очищаем локальный видео стрим
            if (localVideoRef.current) {
              localVideoRef.current.getVideoTracks().forEach(track => track.stop());
              addLocalVideoStream("main", null as unknown as MediaStream);
            }
            console.log(4444)
          } else {
            // Включаем видео
            console.log(2222)
            if (!videoProducerRef.current) {
              console.log(123)
                
              const { producer, stream } = await createProducer(
                'video',
                { video: true, audio: false },
                { mediaType: 'video' },
              );
              
              videoProducerRef.current = producer;
              addLocalVideoStream("main", stream);
            }
          }

          await socket.emitWithAck("setAudioOnly", { audioOnly });
        } catch (err) {
          console.log(err)
          console.error("Error handling audioOnly change:", err);
        }
      };

      handleAudioOnlyChange();
    }, [audioOnly, socket, addLocalVideoStream, localVideoRef]);

    useEffect(() => {
        if (!socket) return;
        console.log("isConnected:", isConnected, "myRoom:", myRoom, "isLeaving:", isLeavingRef);
        
        const handleRoomChange = async () => {
            
            try {
                if (!myRoom) {
                    if (!isLeavingRef.current) await leaveRoom();
                } else {
                    if (!isConnected) return;
                    await joinRoom(Number(myRoom));
                }
            } catch (err) {
                console.error("Room change error:", err);
            }
        };
    
        handleRoomChange();
    }, [isConnected, myRoom]);
  

    const updatePeers = useCallback(async () => {
        if (!socket) return;
        try {
            const { peers } = await socket.emitWithAck('getRoomPeers');
            console.log('Give peer in room')
            dispatch(setPeers(peers));
        } catch (err) {
            console.error('Failed to update peers:', err);
        }
    }, [socket, dispatch]);

    const debouncedUpdatePeers = useMemo(() => debounce(updatePeers, 500, { leading: false, trailing: true }), [updatePeers]);
    useEffect(() => {
        if (!socket) return;

        const onNewProducer = async () => {
            debouncedUpdatePeers();
        };
        const onPeerDisconnected = () => {
            debouncedUpdatePeers()};
        const onPeerMuteStatusChanged = ({ peerId, muted }: any) => {
            debouncedUpdatePeers();
        };
        const onPeerAudioOnlyStatusChanged = () => debouncedUpdatePeers();
        const onDisconnect = () => {
            if (!isLeavingRef.current) leaveRoom();
        };

        const onNewPeer = () => {
          debouncedUpdatePeers();
        };

        socket.on('newProducer', onNewProducer);
        socket.on('newPeer', onNewPeer);
        socket.on('peerDisconnected', onPeerDisconnected);
        socket.on('peerMuteStatusChanged', onPeerMuteStatusChanged);
        socket.on('peerAudioOnlyStatusChanged', onPeerAudioOnlyStatusChanged);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('newProducer', onNewProducer);
            socket.off('newPeer', onNewPeer);
            socket.off('peerDisconnected', onPeerDisconnected);
            socket.off('peerMuteStatusChanged', onPeerMuteStatusChanged);
            socket.off('peerAudioOnlyStatusChanged', onPeerAudioOnlyStatusChanged);
            socket.off('disconnect', onDisconnect);
            debouncedUpdatePeers.cancel();
        };
    }, [socket, consumeMedia, dispatch, debouncedUpdatePeers]);

   
    useEffect(() => {
  if (!socket || roomPeers.length === 0) return;

  const consumerInside = async (peerId: string) => {
    await consumeMedia(peerId);
  };

  const changed =
    roomPeers.length !== prevRoomPeersRef.current.length ||
    roomPeers.some((p, i) =>
      p.id !== prevRoomPeersRef.current[i]?.id ||
      p.audioOnly !== prevRoomPeersRef.current[i]?.audioOnly ||  // <-- сюда важно добавить проверку
      p.muted !== prevRoomPeersRef.current[i]?.muted
    );

  if (changed) {
    prevRoomPeersRef.current = roomPeers;
    roomPeers.forEach(({ id }) => {
      consumerInside(id);
    });
    debouncedUpdatePeers();
  }
}, [roomPeers, socket, debouncedUpdatePeers, consumeMedia]);



    useEffect(() => {
        if (!socket || audioOnly === undefined) return;
        if (!isConnected) return
        const timer = setTimeout(() => {
            socket.emitWithAck('setAudioOnly', { audioOnly });
        }, 500);

        return () => clearTimeout(timer);
    }, [audioOnly, socket]);

    useEffect(() => {
        if (!socket || audioOnly === undefined && !muted) return;
        const timer = setTimeout(() => {
            console.log(muted)
            if (!sendTransportRef.current?.connectionState || !audioProducerRef.current || !socket?.id) {
                return;
            }
            
            if (!sendTransportRef.current?.connectionState) {
                console.error('Transport not connected');
                return;
            }
                try {
                const producer = audioProducerRef.current;
                muted ? producer.pause() : producer.resume();

                socket.emit('setMute', { muted: muted }, (res: any) => {
                    if (!res?.success) console.error('Mute update failed:', res?.error);
                });
            } catch (err) {
                console.error('Mute error:', err);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [muted, socket]);

   useEffect(() => {
  if (!socket) return;

  let isMounted = true;

  const cleanup = async () => {
    if (!isMounted) return;

    try {
      clearAllStreams(); // централизованная очистка всех треков
      setTimeout(() => {
        dispatch(resetVoiceState());
      }, 1000);
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  };

  return () => {
    isMounted = false;
    cleanup();
  };
}, [socket, dispatch, clearAllStreams]);


  const api = useMemo(() => ({
    localAudioRef,
    localVideoRef,
    roomPeers,
    audioOnly,
    localPeerId: socket?.id,
  }), [localAudioRef, localVideoRef, roomPeers, audioOnly, socket?.id]);


  return api;
};

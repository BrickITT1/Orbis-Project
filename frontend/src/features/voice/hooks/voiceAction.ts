import { useEffect, useCallback} from "react"
import { useVoiceSocketContext } from "@/contexts/VoiceSocketContext";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { useDeviceContext } from "@/contexts/DeviceContext";
import { resetVoiceState, setChat, setMyPeer, setStatus, } from "../voiceSlices";
import { useJoinRoomMutation, useLazyGetPeersInRoomQuery, useLeaveRoomMutation } from "../api/voiceApi";
import { useSocketHandlers } from "./soketHandlers";
import { Transport } from "mediasoup-client/lib/types";
import { useMediaStreamContext } from "@/contexts/MediaStreamContext";
import { useTransportContext } from "@/contexts/TransportContext";
import { useConsumeMedia } from "./consume";

export const useJoinVoiceRoom = () => {
  const dispatch = useAppDispatch();
  const authInfo = useAppSelector((state) => state.auth.user?.info);
  const { socket } = useVoiceSocketContext();
  
  const waitForSocketConnection = async (timeout = 5000): Promise<void> => {
    if (socket?.connected) return;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error("Socket connection timeout"));
      }, timeout);

      socket?.once("connect", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  };

  const emitWithTimeout = async <T = any>(event: string, data: any, timeout = 5000): Promise<T> => {
    return Promise.race([
      socket!.emitWithAck(event, data),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout on event: ${event}`)), timeout)
      )
    ]);
  };


  const join = async (roomId: string): Promise<boolean> => {
    if (!authInfo?.username || !authInfo?.id || !socket) return false;
    
    try {
      await waitForSocketConnection();

      const { peerId } = await emitWithTimeout<{ peerId: string }>("get-id", {}, 1000);
      
      dispatch(setMyPeer({
        userId: String(authInfo.id),
        peerId,
        username: authInfo.username,
        muted: false,
        audioOnly: true,
      }));

      dispatch(setChat(roomId));
      
      return true;

    } catch (err) {
      console.error("Failed to join voice room:", err);
      return false;
    }
  };

  
  return join;
};

export const useConnectToVoiceRoom = () => {
  useSocketHandlers();
  const { socket } = useVoiceSocketContext();
  const { device, initDevice } = useDeviceContext();
  const user = useAppSelector((s) => s.voice.myPeer);
  const consumeMedia = useConsumeMedia();
  const peers = useAppSelector(s => s.voice.roomPeers);
  const roomId = useAppSelector((s) => s.voice.roomId);
  const [connectToServer] = useJoinRoomMutation();
  const status = useAppSelector((s) => s.voice.status)
  const [getPeers] = useLazyGetPeersInRoomQuery();

  const {
    sendTransportRef,
    recvTransportRef,
    audioProducerRef,
    videoProducerRef,
    deviceRef,
  } = useTransportContext();

  const {
    addLocalAudioStream,
    addLocalVideoStream,
  } = useMediaStreamContext();

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!peers || status !== "connected") return;
    
    Object.values(peers).forEach((peer) => {
      consumeMedia(peer.peerId); // Только если это не ты сам (в хукe уже есть проверка)
    });
  }, [peers, consumeMedia, status]);

  console.log(status)

  const connectRoom = useCallback(async ({signal}: {signal?: AbortSignal}) => {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    if (status === 'connected') {
      dispatch(setStatus('needdisc'))
      //dispatch(setStatus('needconn'))
    }

    if (status !== 'needconn') return;
    
    if (!socket?.connected || !user || !roomId) return;
    

    // if (!socket.connected) {
    //   await new Promise<void>((resolve) => socket.once("connect", () => resolve()));
    // }

    dispatch(setStatus('connecting'));

    const emitWithTimeout = (event: string, data: any, timeout = 5000) =>
    Promise.race([
      socket.emitWithAck(event, data),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout))
    ]);

    console.log(roomId)
    
    try {
      socket.emit("join-room", { roomId: roomId, peerId: user.peerId })

      await connectToServer({ id: roomId, data: user });
      await getPeers(roomId);

      const { rtpCapabilities } = await emitWithTimeout('getRouterRtpCapabilities', {}, 5000);
      if (!rtpCapabilities) throw new Error('No RTP capabilities received');

      await initDevice(rtpCapabilities);

      if (!device) return;

      const createTransport = async (sender: boolean, roomId:string) => {
        const res = await socket.emitWithAck('createWebRtcTransport', { sender, roomId });
        if (res.error) throw new Error(res.error);
        return res.transport;
      };

      const [sendParams, recvParams] = await Promise.all([
        createTransport(true, roomId),
        createTransport(false, roomId),
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
            roomId: roomId,
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
            const { id } = await socket.emitWithAck('produce', { roomId, kind, rtpParameters });
            cb({ id });
          } catch (err: any) {
            eb(err);
          }
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
      
      // --- AUDIO
      const { producer: audioProducer, stream: audioStream } = await createProducer(
        'audio',
        { audio: true, video: false },
        { mediaType: 'audio' }
      );
      audioProducerRef.current = audioProducer;
      addLocalAudioStream('local-audio', audioStream);

      // --- VIDEO (optional)
      if (!user.audioOnly) {
        const { producer: videoProducer, stream: videoStream } = await createProducer(
          'video',
          { video: true, audio: false },
          { mediaType: 'video' }
        );
        videoProducerRef.current = videoProducer;
        addLocalVideoStream('local-video', videoStream);
      }

      deviceRef.current = device

      dispatch(setStatus('connected'));
    } catch (error) {
      console.error('Failed to connect to voice room:', error);
      dispatch(setStatus('error'));
    } 
    
  }, [socket, user, roomId, connectToServer, initDevice, status]);

  useEffect(() => {
  const abortController = new AbortController();

    async function startConnection() {
      try {
        await connectRoom({ signal: abortController.signal });
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Connection aborted');
        } else {
          console.error(err);
        }
      }
    }
    if (status === 'connecting' || status === 'connected') return; // уже подключаемся/подключены, не дергаем повторно
      if (status === 'needconn') {
        startConnection();
      }

    startConnection();

    return () => {
      abortController.abort(); // отменяем при размонтировании
    };
  }, [status, connectRoom]);



  return status;
};

export const useLeaveRoom = () => {
  const { socket } = useVoiceSocketContext();
  const dispatch = useAppDispatch();
  const status = useAppSelector(s => s.voice.status)
  const user = useAppSelector((s) => s.voice.myPeer);
  const roomId = useAppSelector((s) => s.voice.roomId);
  const [leaveRoom] = useLeaveRoomMutation();
  
  const {
    sendTransportRef,
    recvTransportRef,
    audioProducerRef,
    videoProducerRef,
    consumersRef,
    deviceRef,
  } = useTransportContext();

  const {
    clearAllStreams,
  } = useMediaStreamContext();

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

    
  useEffect(() => {

    if (!roomId || status !== "needdisc") return;

    if (!socket?.connected || !user || !roomId) return;

    const leaveAsync = async () => {
      try {
        dispatch(setStatus('disconnecting'));
        await leaveRoom({ id: roomId, data: user });
        dispatch(resetVoiceState());;
        socket.emit("leave-room", { roomId: roomId, peerId: user.peerId });

        await cleanupProducers();
            
        cleanupConsumers();
        cleanupTransports();
        
        cleanupMediaElements();
        clearAllStreams();
        
        // Reset device
        deviceRef.current = null;


        dispatch(setStatus('disconnected'));
      } catch (error) {
        console.error('Error leaving room:', error);
        dispatch(setStatus('error'));
      } finally {
        dispatch(setStatus("idle"))
      }
    };

    leaveAsync();
  }, [socket, roomId, user, status, leaveRoom, dispatch]);

  return status;
};

export const useSetterAudioOnly = () => {
  const Iam = useAppSelector(s => s.voice);
  const audioOnly = Iam.myPeer.audioOnly;
  const { socket } = useVoiceSocketContext();
  const dispatch = useAppDispatch();
  const [ getPeers ] = useLazyGetPeersInRoomQuery();
  const {
    sendTransportRef,
    videoProducerRef,
  } = useTransportContext();

  const {
    addLocalVideoStream,
    localVideoRef
  } = useMediaStreamContext();

  useEffect(()=> {
    if (!socket) return;
    console.log("useEffect triggered. audioOnly =", audioOnly);
      if (!sendTransportRef.current || !socket || audioOnly === undefined) {
        console.log('Early return:', {
          sendTransport: !!sendTransportRef.current,
          socket: !!socket,
          audioOnly
        });
        return;
      }

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

          await socket.emitWithAck("setAudioOnly", { 
            roomId: Iam.roomId, 
            peerId: Iam.myPeer.peerId, 
            key: "audioOnly", 
            value: Iam.myPeer.audioOnly  
          });
          getPeers(Iam.roomId);
        } catch (err) {
          console.log(err)
          console.error("Error handling audioOnly change:", err);
        }
    };

    const timer = setTimeout(async() => {
        handleAudioOnlyChange()        
    }, 500);
    
    return () => clearTimeout(timer);
  }, [socket, dispatch, Iam.myPeer.audioOnly, ])
}

export const useSetterMute = () => {
  const Iam = useAppSelector(s => s.voice.myPeer);
  const roomId = useAppSelector(s => s.voice.roomId)
  const status = useAppSelector(s => s.voice.status)
  const dispatch = useAppDispatch();
  const { socket } = useVoiceSocketContext();
  const {
    audioProducerRef,
    sendTransportRef,
    videoProducerRef,
  } = useTransportContext();



  useEffect(()=> {
    if (!socket) return;
    if (status != 'connected') return;
    console.log("useEffect triggered. muted =", Iam.muted);
      if (!sendTransportRef.current || !socket ||  Iam.muted === undefined) {
        console.log('Early return:', {
          sendTransport: !!sendTransportRef.current,
          socket: !!socket,
          muted: Iam.muted
        });
        return;
      }

      if (!sendTransportRef.current?.connectionState || !audioProducerRef.current || !socket?.id) {
                return;
      }
      
      if (!sendTransportRef.current?.connectionState) {
          console.error('Transport not connected');
          return;
      }

      try {
        const producer = audioProducerRef.current;
        Iam.muted ? producer.pause() : producer.resume();
    
       socket.emit('setMute', { 
            roomId: roomId, 
            peerId: Iam.peerId, 
            key: "muted", 
            value: Iam.muted  
          }, (res: any) => {
          if (!res?.success) console.error('Mute update failed:', res?.error);
      });
      } catch (err) {
          console.error('Mute error:', err);
      }

  }, [dispatch, Iam.muted, ])
}
import { useEffect, useState, useCallback, useRef } from "react"
import { useVoiceSocketContext } from "../../../contexts/VoiceSocketContext";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useDeviceContext } from "../../../contexts/DeviceContext";
import { resetVoiceState, setChat, setMyPeer, } from "../../../features/voice/voiceSlices";
import { useJoinRoomMutation, useLazyGetPeersInRoomQuery, useLeaveRoomMutation } from "../../../services/voice";
import { store } from "../../store";
import { useSocketHandlers } from "./soketHandlers";
import { Producer, Transport } from "mediasoup-client/lib/types";
import { useMediaStreamContext } from "../../../contexts/MediaStreamContext";

export const useJoinVoiceRoom = () => {
  const dispatch = useAppDispatch();
  const authInfo = useAppSelector((state) => state.auth.user?.info);

  const join = (roomId: string): boolean => {
    if (!authInfo?.username || !authInfo?.id) return false;

    dispatch(setMyPeer({
      peerId: String(authInfo.id),
      username: authInfo.username,
      muted: false,
      audioOnly: true,
    }));

    dispatch(setChat(roomId));
    return true;
  };

  return join;
};

export const useConnectToVoiceRoom = () => {
  useSocketHandlers();
  const { socket } = useVoiceSocketContext();
  const { device, initDevice } = useDeviceContext();
  const user = useAppSelector((s) => s.voice.myPeer);
  const roomId = useAppSelector((s) => s.voice.roomId);
  const [connectToServer] = useJoinRoomMutation();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [getPeers, {data, isSuccess}] = useLazyGetPeersInRoomQuery();
  const sendTransportRef = useRef<Transport | null>(null);
  const recvTransportRef = useRef<Transport | null>(null);
  const audioProducerRef = useRef<Producer | null>(null);
    const videoProducerRef = useRef<Producer | null>(null);
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

  const connectRoom = useCallback(async () => {
    if (!socket?.connected || !user || !roomId) return;

    if (!socket.connected) {
      await new Promise<void>((resolve) => socket.once("connect", () => resolve()));
    }

    setStatus('connecting');
    try {
      await connectToServer({ id: roomId, data: user });
      await getPeers(roomId);
      socket.emit("join-room", { roomId: roomId, peerId: user.peerId })

      const { rtpCapabilities } = await socket.emitWithAck('getRouterRtpCapabilities');
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

      setStatus('connected');
    } catch (error) {
      console.error('Failed to connect to voice room:', error);
      setStatus('error');
    }
    
  }, [socket, user, roomId, connectToServer, initDevice]);

  useEffect(() => {
    connectRoom();

  }, [connectRoom]);

  return status;
};

export const useLeaveRoom = () => {
  const { socket } = useVoiceSocketContext();
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<'idle' | 'disconnecting' | 'disconnected' | 'error'>('idle');
  const user = useAppSelector((s) => s.voice.myPeer);
  const roomId = useAppSelector((s) => s.voice.roomId);
  const isConnected = useAppSelector((s) => s.voice.isConnected);
  const [leaveRoom] = useLeaveRoomMutation();

  useEffect(() => {
    if (!roomId || isConnected !== false) return;

    if (!socket?.connected || !user || !roomId) return;


    const leaveAsync = async () => {
      try {
        setStatus('disconnecting');
        await leaveRoom({ id: roomId, data: user });
        dispatch(resetVoiceState());
        socket.emit("leave-room", { roomId: roomId, peerId: user.peerId })
        setStatus('disconnected');
      } catch (error) {
        console.error('Error leaving room:', error);
        setStatus('error');
      }
    };

    leaveAsync();
  }, [roomId, user, isConnected, leaveRoom, dispatch]);

  return status;
};

export const setAudioOnly = () => {

}

export const setMute = () => {

}
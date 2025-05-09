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
} from "../../../features/voice/voiceSlices";
import { PeerInfo, ProducerInfo, ConsumerInfo } from "../../../types/Channel";
import { useVoiceSocketContext } from "../../../contexts/VoiceSocketContext";
import { debounce } from "lodash";

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
    const [streams, setStreams] = useState<{ 
    audioStreams?: Record<string, MediaStream>;
        videoStreams?: Record<string, MediaStream>;
    }>({ audioStreams: {}, videoStreams: {} });

    const audioOnly = useAppSelector(s => s.voice.myPeer.audioOnly);
    const muted = useAppSelector(s => s.voice.myPeer.muted);
    const isConnected = useAppSelector(s => s.voice.isConnected);
    const myRoom = useAppSelector(s => s.voice.roomId)

    const deviceRef = useRef<Device | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const audioProducerRef = useRef<Producer | null>(null);
    const videoProducerRef = useRef<Producer | null>(null);

    const consumersRef = useRef<Map<string, Consumer>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const prevRoomPeersRef = useRef<PeerInfo[]>([]);
    
    const streamsRef = useRef(streams);
    const activeOperations = useRef(new Set<symbol>());
    const isLeavingRef = useRef(false);
    const consumeMedia = useCallback(
        async (peerId: string) => {
            if (!recvTransportRef.current || !socket?.id || peerId === socket.id) return;

            const iterationKey = Symbol();
            activeOperations.current.add(iterationKey);

            try {
                const { producers } = await socket.emitWithAck('getPeerProducers', { peerId });
                if (!activeOperations.current.has(iterationKey)) return;

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
                        rtpCapabilities: deviceRef.current!.rtpCapabilities,
                    });

                    const consumer = await recvTransportRef.current!.consume({
                        id: response.id,
                        producerId: response.producerId,
                        kind: response.kind,
                        rtpParameters: response.rtpParameters,
                    });

                    const cloned = consumer.track.clone();
                    const stream = new MediaStream([cloned]);
                    if (response.kind === 'audio') audioToAdd[consumerKey] = stream;
                    else videoToAdd[consumerKey] = stream;

                    newConsumers.set(consumerKey, consumer);
                    await socket.emitWithAck('resumeConsumer', { consumerId: consumer.id });
                }

                setStreams((prev) => {
                    const prevAudio = prev.audioStreams ?? {};
                    const prevVideo = prev.videoStreams ?? {};

                    Object.keys(prevAudio)
                        .filter((key) => key.startsWith(`${peerId}-`) && !newConsumers.has(key))
                        .forEach((key) => prevAudio[key].getTracks().forEach(stopTrackSafely));

                    Object.keys(prevVideo)
                        .filter((key) => key.startsWith(`${peerId}-`) && !newConsumers.has(key))
                        .forEach((key) => prevVideo[key].getTracks().forEach(stopTrackSafely));

                    const remainingAudio = Object.fromEntries(
                        Object.entries(prevAudio).filter(([key]) => newConsumers.has(key))
                    );
                    const remainingVideo = Object.fromEntries(
                        Object.entries(prevVideo).filter(([key]) => newConsumers.has(key))
                    );

                    return {
                        audioStreams: { ...remainingAudio, ...audioToAdd },
                        videoStreams: { ...remainingVideo, ...videoToAdd }
                    };
                });

                consumersRef.current.forEach((_, key) => {
                    if (key.startsWith(`${peerId}-`) && !newConsumers.has(key)) {
                        consumersRef.current.get(key)?.close();
                        consumersRef.current.delete(key);
                    }
                });
                newConsumers.forEach((c, key) => consumersRef.current.set(key, c));
            } catch (err) {
                console.error('consumeMedia error:', err);
            } finally {
                activeOperations.current.delete(iterationKey);
            }
        },
        [socket]
    );
    const leaveRoom = useSafeLeaveRoom({
        socket,
        consumersRef,
        audioProducerRef,
        videoProducerRef,
        sendTransportRef,
        recvTransportRef,
        deviceRef,
        audioStreams: streams.audioStreams!,
        setStreams: setStreams,
    });

    useEffect(() => {
        streamsRef.current = streams;
    }, [streams]);

    const connectToVoiceRoom = useCallback(async (roomId: number) => {
        if (!socket?.connected || !username) return false;
            try {
            deviceRef.current = new Device();
            const { rtpCapabilities } = await socket.emitWithAck('getRouterRtpCapabilities');
            await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });

            const { error: joinError } = await socket.emitWithAck('joinRoom', {
                username, 
                roomId, 
                audioOnly 
            });
            if (joinError) throw new Error(joinError as string);

            const createTransport = async (sender: boolean) => {
                const res = await socket.emitWithAck('createWebRtcTransport', { sender });
                if (res.error) throw new Error(res.error);
                return res.transport;
            };

            const [sendParams, recvParams] = await Promise.all([
                createTransport(true),
                createTransport(false)
            ]);

            sendTransportRef.current = deviceRef.current.createSendTransport({ ...sendParams, appData: { sender: true } });
            recvTransportRef.current = deviceRef.current.createRecvTransport({ ...recvParams, appData: { sender: false } });

            const connectHandler = async (params: any, cb: any, eb: any, transport: Transport) => {
                try {
                    await socket.emitWithAck('connectTransport', { transportId: transport.id, dtlsParameters: params.dtlsParameters });
                    cb();
                } catch (e: any) {
                    eb(e);
                }
            };
            sendTransportRef.current.on('connect', (p, cb, eb) => connectHandler(p, cb, eb, sendTransportRef.current!));
            recvTransportRef.current.on('connect', (p, cb, eb) => connectHandler(p, cb, eb, recvTransportRef.current!));

            sendTransportRef.current.on('produce', async ({ kind, rtpParameters }, cb, eb) => {
                try {
                    const { id } = await socket.emitWithAck('produce', { kind, rtpParameters });
                    cb({ id });
                } catch (err: any) {
                    eb(err);
                }
            });

            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = audioStream;
            audioProducerRef.current = await sendTransportRef.current.produce({
                track: audioStream.getAudioTracks()[0],
                appData: { mediaType: 'audio' },
            });

            if (!audioOnly) {
                const videoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    videoProducerRef.current =
                        await sendTransportRef.current.produce({
                    track: videoStream.getVideoTracks()[0],
                    appData: { mediaType: 'video' },
                });
            }

            const [{ peers }, peer] = await Promise.all([
                socket.emitWithAck('getRoomPeers'),
                socket.emitWithAck('getMyPeer')
            ]);

            dispatch(setPeers(peers));
            dispatch(setMyPeer(peer))
            return true;
        } catch (e: any) {
            console.error('connectToVoiceRoom error:', e);
            if (!isLeavingRef.current) {
                isLeavingRef.current = true;
                leaveRoom();
            }
            return false;
        }
    }, [socket, username, audioOnly, dispatch]);

    const joinRoom = useCallback(async (roomId: number, attempt = 1): Promise<boolean> => {
        if (attempt > 5) return false;
        const ok = await connectToVoiceRoom(roomId);
        if (!ok) {
            await new Promise((res) => setTimeout(res, 1000));
            return joinRoom(roomId, attempt + 1);
        }
        return true;
    }, [connectToVoiceRoom]);

    useEffect(() => {
        if (!socket) return;
        console.log("isConnected:", isConnected, "myRoom:", myRoom, "isLeaving:", isLeavingRef);
        
        const handleRoomChange = async () => {
            
            try {
                if (!myRoom) {
                    if (!isLeavingRef.current) await leaveRoom();
                } else {
                    if (!isConnected) return;
                    await joinRoom(myRoom);
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

        socket.on('newProducer', onNewProducer);
        socket.on('newPeer', () => {
            debouncedUpdatePeers()
        });
        socket.on('peerDisconnected', onPeerDisconnected);
        socket.on('peerMuteStatusChanged', onPeerMuteStatusChanged);
        socket.on('peerAudioOnlyStatusChanged', onPeerAudioOnlyStatusChanged);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('newProducer', onNewProducer);
            socket.off('newPeer', debouncedUpdatePeers);
            socket.off('peerDisconnected', onPeerDisconnected);
            socket.off('peerMuteStatusChanged', onPeerMuteStatusChanged);
            socket.off('peerAudioOnlyStatusChanged', onPeerAudioOnlyStatusChanged);
            socket.off('disconnect', onDisconnect);
            debouncedUpdatePeers.cancel();
        };
    }, [socket, consumeMedia, dispatch, debouncedUpdatePeers]);

    useEffect(() => {
        if (!socket || !roomPeers.length) return;
        const consumerInside = async (id: string) => {
            await consumeMedia(id)
        }

        // Сравниваем с предыдущими пирами
        const changed =
            roomPeers.length !== prevRoomPeersRef.current.length ||
            roomPeers.some((p, i) => {
          return p.id !== prevRoomPeersRef.current[i]?.id || 
          p.audioOnly !== prevRoomPeersRef.current[i]?.audioOnly ||
                    p.muted !== prevRoomPeersRef.current[i]?.muted
    });
            
        console.log('change:  ' + changed)
        if (changed) {
            prevRoomPeersRef.current = roomPeers;  // Обновляем ссылку на пиров
            console.log(roomPeers)
            roomPeers.forEach(({id}: {id: string}) => {
                consumerInside(id);
            })
            //debouncedUpdatePeers();  // Теперь мы обновляем только при изменении пиров
        }
    }, [roomPeers, socket, debouncedUpdatePeers]);

    useEffect(() => {
        if (!socket || audioOnly === undefined) return;
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
        if (!socket) return
        let isMounted = true;
        const cleanup = async () => {
            if (!isMounted) return;
            try {
                // Плавная остановка локального потока
                if (localStreamRef.current) {
                    localStreamRef.current.getTracks().forEach(t => {
                        t.dispatchEvent(new Event('ended'));
                        setTimeout(() => t.stop(), 500);
                    });
                }
                // Отложенная очистка состояния
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
    }, [socket, dispatch]);

    const api = useMemo(() => ({
        localStreamRef,
        streams,
        roomPeers,
        audioOnly,
        localPeerId: socket?.id,
    }), [
        streams,
        roomPeers,
        audioOnly,
        socket?.id,
    ]);

    return api;
};

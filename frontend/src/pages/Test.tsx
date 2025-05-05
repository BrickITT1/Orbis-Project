import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import type {
    Transport,
    DtlsParameters,
    IceParameters,
    IceCandidate,
    RtpCapabilities,
    RtpParameters,
    Consumer,
    Producer
} from "mediasoup-client/lib/types";

interface TransportInfo {
    id: string;
    iceParameters: IceParameters;
    iceCandidates: IceCandidate[];
    dtlsParameters: DtlsParameters;
}

export const Test: React.FC = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [roomId, setRoomId] = useState<string>('default-room');
    const [username, setUsername] = useState<string>('');
    const [audioOnly, setAudioOnly] = useState<boolean>(false);
    const [joined, setJoined] = useState<boolean>(false);
    const [peers, setPeers] = useState<Set<string>>(new Set());
    const [messages, setMessages] = useState<Array<{ sender: string; text: string }>>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const deviceRef = useRef<mediasoupClient.Device | null>(null);
    const sendTransportRef = useRef<Transport | null>(null);
    const recvTransportRef = useRef<Transport | null>(null);
    const audioProducerRef = useRef<Producer | null>(null);
    const videoProducerRef = useRef<Producer | null>(null);
    const consumersRef = useRef<Map<string, Consumer>>(new Map());
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideosRef = useRef<HTMLDivElement>(null);

    const [roomPeers, setRoomPeers] = useState<Array<{
            id: string;
            username: string;
            audioOnly: boolean;
        }>
    >([]);

    useEffect(()=> {
        console.log(joined)
    })

    useEffect(() => {
        if (!socket) return;
        const handleExistingProducers = async ({ producers }: any) => {
            for (const producer of producers) {
                // Пропускаем свои собственные продюсеры
                if (producer.peerId === socket.id) continue;
                if (!peers.has(producer.peerId)) {
                    setPeers(prev => new Set(prev).add(producer.peerId));
                }
                await consumeMedia(producer.peerId);
            }
        };
        socket.on("existingProducers", handleExistingProducers);

        return () => {
            socket.off('existingProducers', handleExistingProducers);
        };
    }, [socket, peers]);

    useEffect(() => {
        const newSocket = io('https://26.234.138.233:3000', {
            secure: true,
            rejectUnauthorized: false,
        });
        newSocket.on("connect", () => {
            console.log('Socket connected:', newSocket.id);
            setSocket(newSocket);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!socket) return;

        const handleNewPeer = ({ peerId, audioOnly }: { peerId: string; audioOnly: boolean }) => {
            console.log('New peer connected:', peerId);
            setPeers(prev => new Set(prev).add(peerId));
            if (!audioOnly) consumeMedia(peerId);
        };

        const handlePeerDisconnected = (peerId: string) => {
            console.log('Peer disconnected:', peerId);
            setPeers(prev => {
                const newPeers = new Set(prev);
                newPeers.delete(peerId);
                return newPeers;
            });
            const videoElement = document.getElementById(`video-${peerId}`);
            if (videoElement) videoElement.remove();
        };

        const handleNewProducer = ({ peerId, producerId, kind }: { 
      peerId: string; 
      producerId: string; 
      kind: string 
        }) => {
            console.log('New producer from peer:', peerId, producerId, kind);
            if (kind === 'video') consumeMedia(peerId);
        };

        const handleConnection = ({ peers }: any) => {
            console.log('Room peers updated:', peers);
            setRoomPeers(peers);
            // Для новых пользователей создаём consumer
            peers.forEach((peer: any) => {
                if (peer.id !== socket.id && !peers.some((p: { id: string; username: string; audioOnly: boolean }) => p.id === peer.id)) {
                    if (!peer.audioOnly) {
                        consumeMedia(peer.id);
                    }
                }})};
        

        socket.on('newPeer', handleNewPeer);
        socket.on('peerDisconnected', handlePeerDisconnected);
        socket.on('newProducer', handleNewProducer);
        socket.on('roomPeers', handleConnection);

        socket.emit('getRoomPeers', (response: {error: string; peers: any}) => {
            if (!response.error) {
                setRoomPeers(response.peers);
            }
        });

        return () => {
            socket.off('newPeer', handleNewPeer);
            socket.off('peerDisconnected', handlePeerDisconnected);
            socket.off('newProducer', handleNewProducer);
            socket.off('roomPeers');
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        const handleExistingProducers = async ({
            producers,
        }: {
            producers: Array<{
                peerId: string;
                producerId: string;
                kind: string;
            }>;
        }) => {
            for (const producer of producers) {
                if (!peers.has(producer.peerId)) {
                    setPeers(prev => new Set(prev).add(producer.peerId));
                }
                await consumeMedia(producer.peerId);
            }
        };
        socket.on("existingProducers", handleExistingProducers);

        return () => {
            socket.off('existingProducers', handleExistingProducers);
        };
    }, [socket, peers]);

    useEffect(() => {
        if (joined) {
            const init = async () => {
                await startLocalMedia();
                // Запросить текущих участников
                socket?.emit('getRoomPeers', (response: any) => {
                    if (response.peers) {
                        setRoomPeers(response.peers);
                        response.peers.forEach((peer: any) => {
                            if (peer.id !== socket.id && !peer.audioOnly) {
                                consumeMedia(peer.id);
                            }
                        });
                    }
                });
            };
            init();
        }
    }, [joined]);

    useEffect(() => {
        const checkAudio = () => {
            const audioElements = document.querySelectorAll('audio');
            console.log('Текущие аудио-элементы:', audioElements.length);
            audioElements.forEach((el) => {
                const audio = el as HTMLAudioElement;
                console.log(`Аудио ${audio.id}:`, {
                    playing: !audio.paused,
                    readyState: audio.readyState,
                    error: audio.error
                });
            });
        };

        // Проверяем каждые 5 секунд
        const interval = setInterval(checkAudio, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        return () => {
            // Очистка при размонтировании компонента
            if (joined) leaveRoom();
            // Дополнительная очистка аудио элементов
            document.querySelectorAll('audio[id^="audio-"]').forEach((el: any) => {
                const stream = el.srcObject as MediaStream;
                if (stream) stream.getTracks().forEach(track => track.stop());
                el.remove();
            });
        };
    }, [joined]);

    const joinRoom = async () => {
        if (!socket || !username || !roomId) {
            console.error('Missing required fields');
            return;
        }
        try {
            if (!deviceRef.current) {
                console.log('[1] Initializing device...');
                deviceRef.current = new mediasoupClient.Device();
                console.log("[2] Loading device capabilities...");
                try {
                    const { rtpCapabilities } = await socket.emitWithAck('getRouterRtpCapabilities');
                    await deviceRef.current.load({ routerRtpCapabilities: rtpCapabilities });
                    console.log('Device loaded successfully:', deviceRef.current.loaded);
                } catch (error) {
                    console.error('Failed to load device:', error);
                    throw error;
                }
            }

            console.log('[3] Joining room...');
            await socket.emitWithAck('joinRoom', { 
                username, 
                roomId, 
                audioOnly 
            });

            console.log('[4] Creating send transport...');
            try {
                const { transport } = await socket.emitWithAck('createWebRtcTransport', { sender: true });
                console.log("[5] Creating client transport instance...");
                sendTransportRef.current = deviceRef.current.createSendTransport({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                    appData: { type: 'send' }
                });

                // Добавьте обработчики состояния транспорта
                sendTransportRef.current.on('connectionstatechange', (state) => {
                    console.log('Send transport state:', state);
                });
            } catch (error) {
                console.error('Transport creation failed:', error);
                throw error;
            }
            console.log('[6] Transport created with ID:', sendTransportRef.current.id);
            console.log('[6.1] Creating receive transport...');
            try {
                const { transport: recvTransport } = await socket.emitWithAck('createWebRtcTransport', { 
                    sender: false 
                });
                recvTransportRef.current =
                    deviceRef.current.createRecvTransport({
                    id: recvTransport.id,
                    iceParameters: recvTransport.iceParameters,
                    iceCandidates: recvTransport.iceCandidates,
                    dtlsParameters: recvTransport.dtlsParameters,
                    appData: { type: 'recv' }
                });
                recvTransportRef.current.on(
                    "connectionstatechange",
                    (state) => {
                    console.log('Recv transport state:', state);
                });
                recvTransportRef.current.on(
                    "connect",
                    async ({ dtlsParameters }, callback, errback) => {
                    try {
                        await socket.emitWithAck('connectTransport', {
                            transportId: recvTransportRef.current?.id,
                            dtlsParameters,
                        });
                        callback();
                    } catch (error: any) {
                        console.error('Recv transport connect error:', error);
                        errback(error);
                    }
                });
            } catch (error) {
                console.error('Receive transport creation failed:', error);
                throw error;
            }
            // Настройка обработчиков транспорта
            sendTransportRef.current.on('connect', async ({ dtlsParameters }, callback, errback) => {
                try {
                    console.log('Transport connect event');
                    await socket.emitWithAck('connectTransport', {
                        transportId: sendTransportRef.current?.id,
                        dtlsParameters,
                    });
                    callback();
                } catch (error: any) {
                    console.error('Transport connect error:', error);
                    errback(error);
                }
            });

            sendTransportRef.current.on(
                "produce",
                async ({ kind, rtpParameters }, callback, errback) => {
                try {
                    console.log('Produce event:', kind);
                    const { id } = await socket.emitWithAck('produce', { 
                        kind, 
                        rtpParameters 
                    });
                    callback({ id });
                } catch (error: any) {
                    console.error('Produce error:', error);
                    errback(error);
                }
            });
            console.log("[7] Starting local media...");
            const { peers } = await socket.emitWithAck('getRoomPeers');
            setRoomPeers(peers);
            setJoined(true)
            try {
                await startLocalMedia();
            } catch (mediaError) {
                console.error('Media initialization failed:', mediaError);
                alert('Please allow access to microphone' + (audioOnly ? '' : ' and camera'));
                throw mediaError;
            }

            console.log('[8] Room joined successfully');
            setJoined(true);

        } catch (error: any) {
            console.error('Join room failed:', error);
            // Очистка ресурсов при ошибке
            if (sendTransportRef.current) {
                sendTransportRef.current.close();
                sendTransportRef.current = null;
            }
            if (!error.message.includes("Media access")) {
                alert(`Join error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }  
        }
    };

    const startLocalMedia = async () => {
        if (!deviceRef.current || !sendTransportRef.current) {
            throw new Error('Device or transport not initialized');
        }
        try {
            console.log('Requesting media permissions...');
            // Сначала проверяем доступные устройства
            const devices = await navigator.mediaDevices.enumerateDevices();
            const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
            // Формируем constraints в зависимости от наличия видеоустройств
            const constraints: MediaStreamConstraints = {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    channelCount: 2,
                    sampleRate: 48000,
                },
                video: audioOnly ? false : hasVideoDevice ? {
                    width: { ideal: 640, max: 1280 },
                    height: { ideal: 480, max: 720 },
                    frameRate: { ideal: 24, max: 30 }
                } : false
            };
            const stream =
                await navigator.mediaDevices.getUserMedia(constraints);

            console.log(
                "Media stream obtained with tracks:",
                stream.getTracks(),
            );

            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                console.error('Не удалось получить аудио-дорожку!');
                throw new Error('Аудио-дорожка не найдена');
            } else {
                console.log('Аудио-дорожка получена:', audioTracks[0].label);
            }
            // Отображение локального видео (если есть видео и не audioOnly)
            if (!audioOnly && hasVideoDevice && localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
                console.log('Local video attached');
            }

            // Создаем аудио продюсер
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                console.log('Creating audio producer...');
                audioProducerRef.current = await sendTransportRef.current.produce({
                    track: audioTrack,
                    codecOptions: {
                        opusStereo: true,
                        opusDtx: true,
                        opusFec: true
                    },
                    appData: { mediaType: 'audio' }
                });
                // Добавляем обработку ошибок
                audioProducerRef.current.on('trackended', () => {
                    console.error('Audio track ended unexpectedly');
                    //restartAudioTrack();
                });
            }

            // Создаем видео продюсер (если нужно)
            if (!audioOnly) {
                const videoTrack = stream.getVideoTracks()[0];
                if (videoTrack) {
                    console.log('Creating video producer...');
                    videoProducerRef.current = await sendTransportRef.current.produce({
                        track: videoTrack,
                        encodings: [
                            { maxBitrate: 1000000 },
                            { maxBitrate: 500000 },
                            { maxBitrate: 250000 }
                        ],
                        codecOptions: {
                            videoGoogleStartBitrate: 1000
                        },
                        appData: { mediaType: 'video' }
                    });
                    console.log('Video producer created:', {
                        id: videoProducerRef.current.id,
                        kind: videoProducerRef.current.kind,
                        track: videoProducerRef.current.track
                    });
                }
            }

            // Отображаем локальное видео
            if (localVideoRef.current && !audioOnly) {
                localVideoRef.current.srcObject = stream;
            }
            console.log('Audio tracks:', stream.getAudioTracks().map(t => ({
                id: t.id,
                kind: t.kind,
                enabled: t.enabled,
                muted: t.muted,
                readyState: t.readyState
            })));
        } catch (error) {
            console.error('Failed to start local media:', error);
            throw new Error(`Media access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const consumeMedia = async (peerId: string) => {
        if (peerId === socket?.id) return;
        if (!recvTransportRef.current) {
            console.error('Receive transport not initialized');
            return;
        }
        try {
            const { producers } = await socket!.emitWithAck('getPeerProducers', { peerId });
            if (!producers || producers.length === 0) return;
            for (const producer of producers) {
                try {
                    if (producer.peerId === socket?.id && producer.kind === 'audio') continue;
                    const response = await socket!.emitWithAck('consume', {
                        producerId: producer.id,
                        rtpCapabilities: deviceRef.current!.rtpCapabilities
                    });
                    const consumer = await recvTransportRef.current.consume({
                        id: response.id,
                        producerId: response.producerId,
                        kind: response.kind,
                        rtpParameters: response.rtpParameters
                    });

                    // Для аудио
                    if (response.kind === 'audio') {
                        const audioContainer = document.getElementById(`audio-container-${peerId}`) || 
              document.createElement('div');
                        audioContainer.id = `audio-container-${peerId}`;
                        const audioElement = document.createElement("audio");
                        audioElement.id = `audio-${peerId}-${producer.id}`;
                        audioElement.autoplay = true;
                        audioElement.controls = false;
                        //audioElement.style.display = 'none';
                        const stream = new MediaStream([consumer.track]);
                        audioElement.srcObject = stream;
                        // Решение проблемы автовоспроизведения
                        const playAudio = () => {
                            audioElement.play().catch(e => console.log('Auto-play prevented:', e));
                        };
                        audioElement.onloadedmetadata = playAudio;
                        audioContainer.appendChild(audioElement);
                        document.body.appendChild(audioContainer);
                        await socket!.emitWithAck("resumeConsumer", {
                            consumerId: consumer.id,
                        });
                    }

                    if (response.kind === 'video' && !audioOnly) {
                        const videoContainer = document.getElementById(`video-container-${peerId}`) || 
              document.createElement('div');
                        videoContainer.id = `video-container-${peerId}`;
                        const videoElement = document.createElement("video");
                        videoElement.id = `video-${peerId}-${producer.id}`;
                        videoElement.autoplay = true;
                        videoElement.playsInline = true;
                        videoElement.srcObject = new MediaStream([consumer.track]);
                        // Очищаем предыдущие элементы
                        while (videoContainer.firstChild) {
                            videoContainer.removeChild(videoContainer.firstChild);
                        }
                        videoContainer.appendChild(videoElement);
                        remoteVideosRef.current?.appendChild(videoContainer);
                        console.log("Video element created for peer:", peerId);
                    }
                } catch (error) {
                    console.error(`Error consuming ${producer.kind} from ${peerId}:`, error);
                }
            }
        } catch (error) {
            console.error('Consume media error:', error);
        }
    };

    const sendMessage = () => {
        if (!socket || !newMessage.trim()) return;
        socket.emit("sendMessage", { text: newMessage });
        setMessages(prev => [...prev, { sender: 'You', text: newMessage }]);
        setNewMessage('');
    };

    const leaveRoom = () => {
        if (!socket) return;
        // Остановка всех локальных медиапотоков
        if (localVideoRef.current?.srcObject) {
            const stream = localVideoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            localVideoRef.current.srcObject = null;
        }
        // Закрытие всех продюсеров
        audioProducerRef.current?.close();
        videoProducerRef.current?.close();
        // Удаление всех удаленных аудио элементов
        document.querySelectorAll('audio[id^="audio-"]').forEach((el: any) => {
            const stream = el?.srcObject as MediaStream;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            el.remove();
        });
        // Удаление всех удаленных видео элементов
        if (remoteVideosRef.current) {
            remoteVideosRef.current.innerHTML = '';
        }

        // Отключение от комнаты
        socket.emit('leaveRoom');
        setJoined(false);
        setPeers(new Set());
    };

    if (!joined) {
        return (
            <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
                <h1>Join Voice Chat</h1>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Room ID:</label>
                    <input
                        type="text"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>
                        <input
                            type="checkbox"
                            checked={audioOnly}
                            onChange={(e) => setAudioOnly(e.target.checked)}
                        />
              Audio Only
          </label>
                </div>
                <button
                    onClick={joinRoom}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
            Join Room
        </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Левая панель - участники и чат */}
            <div style={{ width: '300px', borderRight: '1px solid #ccc', padding: '10px' }}>
                <h2>Room: {roomId}</h2>
                <h3>Participants ({peers.size + 1})</h3>
                <div className="participants-grid">
                    {Array.from(peers).map(peerId => {
                        const peer = roomPeers.find(p => p.id === peerId);
                        return (
                            <div key={peerId} className="participant-card">
                                <h4>{peer?.username || 'Unknown'}</h4>
                                <div id={`video-container-${peerId}`} />
                                {peer?.audioOnly && <div className="audio-only-badge">Audio Only</div>}
                            </div>
                        );
                    })}
                </div>
                <h3>Chat</h3>
                <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #ddd', marginBottom: '10px' }}>
                    {messages.map((msg, index) => (
                        <div key={index} style={{ marginBottom: '5px' }}>
                            <strong>{msg.sender}: </strong>{msg.text}
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex' }}>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        style={{ flex: 1, padding: '8px' }}
                    />
                    <button
                        onClick={sendMessage}
                        style={{ padding: '8px 12px', marginLeft: '5px' }}
                    >
              Send
          </button>
                </div>
                <button
                    onClick={leaveRoom}
                    style={{
                        marginTop: '20px',
                        padding: '10px 15px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
            Leave Room
        </button>
            </div>
            <div className="audio-debug">
            {/* Основная область - видео */}
            <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column' }}>
                <h2>Video Chat</h2>
                {/* Локальное видео */}
                <div style={{ marginBottom: '20px' }}>
                    <h3>You</h3>
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '320px', height: '240px', backgroundColor: '#eee' }}
                    />
                </div>
                {/* Удаленные видео */}
                <div>
                    <h3>Participants</h3>
                    <div
                        ref={remoteVideosRef}
                        style={{ display: 'flex', flexWrap: 'wrap' }}
                    />
                </div>
            </div>
        </div>
        </div>
    );
};

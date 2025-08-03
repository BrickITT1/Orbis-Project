# MEDIA SERVICE

### STACK: Express.js, Typescript, REDIS, Socket.IO, Mediasoup

Media Service is a real-time voice and video chat backend built with TypeScript, Redis, Mediasoup, and WebSockets. It handles WebRTC signaling, peer connection management, and media transport setup.

Peer information is stored in Redis, while non-serializable data (like active transports and consumers) is kept in in-memory caches. The service uses Mediasoup for low-latency media streaming.

## LAUNCH

Installing dependencies
```bash
npm install
```

Building and running
```bash
npm run start
```

Linter code
```bash
npm run lint:fix
```

## STRUCTURE

```
AUTHSERVICE
└── src
    ├── cache
    │   ├── consumerCache.ts
    │   ├── producerCache.ts
    │   ├── transportCache.ts
    ├── config
    │   ├── app.config.ts
    │   ├── db.ts
    │   └── redis.config.ts
    │   └── mediasoup-config.ts
    ├── controllers
    │   └── roomController.ts
    ├── middleware
    │   └── authSocket.ts
    ├── routes
    │   └── mediasoupRouter.ts
    │   └── roomRoutes.ts
    ├── services
    │   ├── handkers
    │   │   └── consume.handler.ts    
    │   │   └── room.handler.ts   
    │   │   └── transport.handler.ts   
    │   └── transportService.ts
    ├── socket
    │   └── roomService.ts
    │   └── transportService.ts
    ├── types
    │   └── createWebRTCTransport.ts
    │   └── socket.ts
    ├── selfsigned_key.pem
    ├── selfsigned.pem
    └── server.ts
├── .env
├── .gitignore
├── eslint.config.mjs
├── package.json
├── README.md
└── tsconfig.json
```

## API ENDPOINTS

|Method | Path                  | Description                                   |
|-------|-----------------------|-----------------------------------------------|
| GET   | `/:roomID/join`       | Join in voice room                            |
| POST  | `/:roomID/leave`      | Leave                                         |
| DELETE| `/:roomID/peers`      | Get members in room                           |

## Socket.IO Signal Table for Media Service

| **Event**                   | **Payload**                               | **Description**                                                                                   | **Response via Callback**                                        |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `get-id`                    | —                                         | Returns the `peerId` of the connected socket.                                                     | `{ peerId }`                                                     |
| `join-room`                 | `{ roomId, peerId }`                      | Joins a peer to the specified room.                                                               | —                                                                |
| `setAudioOnly`              | `{ roomId, peerId, key, value }`          | Sets the peer to audio-only mode.                                                                 | `{ success: true }`                                              |
| `setMute`                   | `{ roomId, peerId, key, value }`          | Mutes/unmutes the peer’s producers (audio/video).                                                 | `{ success: true }`                                              |
| `leave-room`                | `{ roomId, peerId }`                      | Leaves the room, cleans up producers, consumers, transports, and notifies others.                 | `{ success: true }` or `{ error }`                               |
| `disconnect`                | —                                         | Automatically triggered when the socket disconnects. Cleans up all resources and notifies others. | —                                                                |
| `getRouterRtpCapabilities`  | —                                         | Returns the mediasoup router RTP capabilities needed for initializing the client device.          | `{ rtpCapabilities }` or `{ error }`                             |
| `createWebRtcTransport`     | `{ sender, roomId }`                      | Creates a WebRTC transport for sending or receiving media.                                        | `{ transport }` or `{ error }`                                   |
| `connectTransport`          | `{ roomId, transportId, dtlsParameters }` | Finalizes the DTLS handshake between client and server.                                           | `{ success: true }` or `{ error }`                               |
| `produce`                   | `{ roomId, kind, rtpParameters }`         | Creates a media producer (audio or video) for the current peer.                                   | `{ id }` or `{ error }`                                          |
| `getPeerProducers`          | `{ roomId, peerId }`                      | Gets the list of media producers from a specific peer.                                            | `{ producers: [] }` or `{ error }`                               |
| `consume`                   | `{ roomId, producerId, rtpCapabilities }` | Creates a consumer to receive media from another peer's producer.                                 | `{ id, producerId, kind, rtpParameters, peerId }` or `{ error }` |
| `resumeConsumer`            | `{ consumerId }`                          | Resumes a paused consumer.                                                                        | `{ success: true }` or `{ error }`                               |
| `newProducer` *(emit)*      | `{ peerId, producerId, kind }`            | Emitted to other clients in the room when a new producer is created.                              | —                                                                |
| `peerDisconnected` *(emit)* | `socket.id`                               | Emitted to others when a peer disconnects or leaves the room.                                     | —                                                                |
| `newPeer` *(emit)*          | `socket.id`                               | Notifies others of a new or updated peer (e.g., after mute/audio-only change).                    | —                                                                |


## EXAMPLE .env
```
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
MEDIAPORT=
FRONTENDADDRES=
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
```
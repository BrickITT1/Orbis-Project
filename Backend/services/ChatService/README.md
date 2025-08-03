# CHAT SERVICE

### STACK: Express.js, Typescript, REDIS, PostgreSQL, Socket.IO

Chat Service is a server-side chat system built with Express.js, TypeScript, PostgreSQL, Redis, and Socket.IO.

Messages are sent and deleted via HTTP requests, while Socket.IO is used to support real-time updates.
Data is stored in PostgreSQL, with Redis used for caching and performance optimization.

The service is scalable and ready for integration with client applications.

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
    ├── config
    │   ├── app.config.ts
    │   ├── db.ts
    │   └── redis.config.ts
    ├── controllers
    │   └── chatController.ts
    ├── middleware
    │   └── authMiddleware.ts
    ├── routes
    │   └── ChatRoutes.ts
    ├── types
    │   └── socket.ts
    ├── utils
    │   └── chatSocket.ts
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
| GET   | `/chats/:id/messages` | Fetch messages for a specific chat (:id)    |
| POST  | `/chats/:id/messages` | send a new message (:id)                |
| DELETE| `/message/?id=`       | delete a message by ID                          |

## SOCKET EVENTS

#### Incoming Events
| **Event**      | **Payload**       | **Description**                                                             | **Response via Callback** |
| -------------- | ----------------- | --------------------------------------------------------------------------- | ------------------------- |
| `join-chat`    | `chatId: string`  | Adds the user socket to a specific chat room.                               | —                         |
| `leave-chat`   | `chatId: string`  | Removes the user socket from a specific chat room.                          | —                         |
| `send-message` | `chat_id: string` | Emits a `new-message` event to everyone in the chat room.                   | —                         |
| `disconnect`   | —                 | Automatically triggered when a user disconnects. Logs a disconnect message. | —                         |

#### Outgoing Events 
| **Event**     | **Payload** | **Description**                                                  |
| ------------- | ----------- | ---------------------------------------------------------------- |
| `new-message` | —           | Sent to all clients in the room when a new message is triggered. |


## EXAMPLE .env
```
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
CHATPORT=
FRONTENDADDRES=
DB_HOST=
DB_USER=
DB_NAME=
DB_PASSWORD=
DB_PORT=
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
```
# USER SERVICE

### STACK: Express.js, Typescript, REDIS, Socket.IO

The service is a social platform where users can:

- Create and join servers (similar to Discord/Slack),
- Communicate in chats and voice channels,
- Manage friends and invitations,
- Receive real-time notifications via a WebSocket connection.

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
    │   ├── serverController.ts
    │   └── userController.ts
    ├── routes
    │   ├── serverRoutes.ts
    │   └── userController.ts
    ├── utils
    │   └── journalSocket.ts
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

### Server endpoints
| Method | Path                  | Description                             |
| ------ | --------------------- | --------------------------------------- |
| GET    | `/server`             | Get a list of all servers               |
| GET    | `/server/:id`         | Get information about a specific server |
| GET    | `/server/:id/members` | Get brief info about server members     |
| POST   | `/server`             | Create a new server                     |
| POST   | `/server/:id/join`    | Join a server                           |
| POST   | `/server/:id/voice`   | Create a voice channel                  |
| POST   | `/server/:id/chat`    | Create a chat channel                   |

### User endpoints

| Method | Path                  | Description                      |
| ------ | --------------------- | -------------------------------- |
| GET    | `/user/:id`           | Get user information by ID       |
| GET    | `/user/search`        | Search for a user by name        |
| POST   | `/user/:id/chatstart` | Start a private chat with a user |
| GET    | `/chats/`             | Get the list of the user's chats |


### Friend endpoints

| Method | Path                  | Description                  |
| ------ | --------------------- | ---------------------------- |
| GET    | `/friend`             | Get the list of friends      |
| POST   | `/friend/:id/invite`  | Send a friend request        |
| POST   | `/friend/:id/confirm` | Accept a friend request      |
| POST   | `/friend/:id/reject`  | Reject a friend request      |
| GET    | `/friend/invme`       | Get incoming friend requests |
| GET    | `/friend/invi`        | Get outgoing friend requests |


## Socket.IO Signal Table for Media Service

The socket is used to synchronize real-time events such as user status or changes on the server.

#### client → server
| Event                | Arguments                            | Description                                   |
| -------------------- | ------------------------------------ | --------------------------------------------- |
| `set-status`         | `userId: string`, `status: string`   | Set the user's status (e.g., online, offline) |
| `join-server`        | `serverId: string`                   | Join the server room                          |
| `leave-server`       | `serverId: string`                   | Leave the server room                         |
| `update-into-server` | `signal: string`, `serverId: string` | Emit an update event within the server        |

#### server → client
| Event                | Emitted to                | Description                                |
| -------------------- | ------------------------- | ------------------------------------------ |
| `user-online`        | All except sender         | Notifies others that the user is online    |
| `update-into-server` | All in `server:{id}` room | Notify users in the server about an update |



## EXAMPLE .env
```
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
USERPORT=
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
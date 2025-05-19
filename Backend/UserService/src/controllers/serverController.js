import { v4 as uuidv4 } from "uuid";
import jwt from 'jsonwebtoken'
import { userInfo } from "./userController.js";

const chats = [
    {
        id: 1,
        name: "My chat 0",
        type: "ls",
        lastmessage: "hi",
        created_at: '',
        updated_at: '',
        avatar_url: '/img/icons.png',
        creator: 0,
        owner: 5,
        voice: 1,
    },
    {
        id: 2,
        name: "My chat 1",
        type: "ls",
        lastmessage: "hi",
        created_at: '',
        updated_at: '',
        avatar_url: '/img/icon.png',
        creator: 1,
        owner: 2,
        voice: 2,
    },
    {
        id: 3,
        name: "My chat 2",
        type: "ls",
        lastmessage: "hi",
        created_at: '',
        updated_at: '',
        avatar_url: '/img/icon.png',
        creator: 0,
        owner: 1,
        voice: 2,
    },
]

const voices = [
    {
        id: 1,
        name: "voice 0",
        type: "voice",
    },
    {
        id: 2,
        name: "voice 1",
        type: "voice",
    },
]

const servers = [
    {
        id: 1,
        name: "server 1",
        owner: 1,
        users: [1, 2],
        chats: [2, 3],
        voices: [1, 2]
    },
    {
        id: 2,
        name: "server 2",
        owner: 3,
        users: [3],
        chats: [],
        voices: [2]
    },
    {
        id: 3,
        name: "server 3",
        owner: 2,
        users: [1, 2, 3],
        chats: [3, 2],
        voices: [2],
    },
] 
  
const getServers = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        res.json(servers.filter(val => val.owner == decoded?.id || val.users.includes(decoded.id)))
    } catch (err) {
        res.sendStatus(401).json({ message: 'need refresh' })
    }
}



const getFastInfoUserServer = async (req, res) => {
    try {
        const server = servers.find(val => val.id == req.params.id);

        if (!server) return res.status(404).json({ message: 'server not found' })

        const userIds = server.users;

        res.json(userInfo.filter(val => val.id == req.params.id || userIds.includes(val.id)))
    } catch (err) {
        res.status(401).json({ message: 'need refresh' })
    }
}

const getServerInfo = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const serverId = parseInt(req.params.id);
        const server = servers.find(s => s.id === serverId);
        
        if (!server) {
            return res.status(404).json({ message: 'Server not found' });
        }

        if (server.owner !== decoded.id && !server.users.includes(decoded.id)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Get chat details for this server
        const serverChats = chats.filter(chat => server.chats.includes(chat.id));
        const serverVoices = voices.filter(voice => server.voices.includes(voice.id));
        
        const serverInfo = {
            ...server,
            chats: serverChats,
            voices: serverVoices
        };

        res.json(serverInfo);
    } catch (err) {
        res.sendStatus(401).json({message: 'need refresh'})
    }
    
}

const createServer = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);
        servers.push({
            id: servers[servers.length - 1].id + 1,
            name: req.body.name,
            owner: decoded?.id,
            users: [decoded?.id],
            chats: [],
            voices: [],
        })
        res.status(200).json({ message: 'Successfully create the server' });
    } catch (err) {
        res.sendStatus(401).json({message: 'need refresh'})
    }
}
  
const joinServer = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.sendStatus(401);

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);

        const serverId = parseInt(req.params.id);
        if (!serverId) return res.status(400).json({ message: 'Server ID is required' });

        const server = servers.find(s => s.id === serverId);
        if (!server) return res.status(404).json({ message: 'Server not found' });

        const userId = decoded.id;

        // Проверим, не добавлен ли уже пользователь
        if (server.users.includes(userId) || server.owner === userId) {
            return res.status(409).json({ message: 'User already in server' });
        }

        // Добавим пользователя
        server.users.push(userId);

        res.status(200).json({ message: 'Successfully joined the server' });
    } catch (err) {
        console.error(err);
        res.sendStatus(401).json({ message: 'need refresh' });
    }
};

const createVoice = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);
        const server = servers.find(s => s.id === Number(req.params.id));
        
        if (!server) {
            return res.status(404).json({ message: 'Server not found' });
        }
        

        const chatId = chats[chats.length - 1].id + 1
        chats.push({
            id: chatId,
            name: "Default",
            type: "ls",
            lastmessage: "hi",
            created_at: '',
            updated_at: '',
            avatar_url: '/img/icon.png',
            creator: 1,
            owner: 2,
            voice: 2,
        },)
        
        server.chats.push(chatId)
        
        res.status(200).json({ message: 'Successfully create the chat' });
    } catch (err) {
        res.sendStatus(401).json({message: 'need refresh'})
    }
}

const createChat = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);
        const server = servers.find(s => s.id === Number(req.params.id));
        
        if (!server) {
            return res.status(404).json({ message: 'Server not found' });
        }
        

        const voiceId = voices[voices.length - 1].id + 1
        voices.push({
            id: voiceId,
            name: 'default',
            type: 'voice'
        })
        
        server.voices.push(voiceId)
        
        res.status(200).json({ message: 'Successfully create the voice' });
    } catch (err) {
        res.sendStatus(401).json({message: 'need refresh'})
    }
}

export { getServers,getServerInfo, createServer, joinServer, createVoice, createChat, getFastInfoUserServer };
export default servers;
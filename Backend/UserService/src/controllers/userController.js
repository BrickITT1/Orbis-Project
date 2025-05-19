import { v4 as uuidv4 } from "uuid";
import jwt from 'jsonwebtoken'
import servers from "./serverController.js";

export const userInfo = [
    {
        id: 1,
        name: 'aaaaaa',
        avatar_url: '',
        about: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        gender: '',
        friends: [2, 3],
    },
    {
        id: 2,
        name: 'bbbbbb',
        avatar_url: '',
        about: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        gender: '',
         friends: [1],
    },
    {
        id: 3,
        name: 'cccccc',
        avatar_url: '',
        about: 'cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
        gender: '',
         friends: [1],
    }
]
  
const getFastUserInfo = async (req, res) => {
    try {
        const userId = Number(req.params.id);
        
        // 1. Находим самого пользователя
        const user = userInfo.filter(val => val.id === userId);
        
        // 3. Собираем всех пользователей из этих серверов
        const usersInOwnedServers = [];
        servers.forEach(server => {
            server.users.forEach(userId => {
                const user = userInfo.find(u => u.id === userId);
                if (user && !usersInOwnedServers.some(u => u.id === user.id)) {
                    usersInOwnedServers.push(user);
                }
            });
        });
        
        // 4. Объединяем самого пользователя и всех пользователей из его серверов
        const result = [...user, ...usersInOwnedServers];
        
        res.json(result);
    } catch (err) {
        res.status(401).json({ message: 'need refresh' });
    }
};


const getUsersOnServer = async (req, res) => {
    try {
        const serverId = Number(req.params.id);
        const server = servers.find(s => s.id === serverId);
        if (!server) {
            return res.status(404).json({ message: 'Server not found' });
        }

        const usersOnServer = userInfo.filter(user => server.users.includes(user.id));

        res.json(usersOnServer);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getUsersFriends = async (req, res) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);

        const iam = userInfo.find(u => u.id === decoded?.id);

        const Friends = userInfo.filter(user => iam.friends.includes(user.id));

        res.status(200).json({Friends});
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

const getUserInfo = async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        res.json(userInfo.filter(user => user.id == userId));
    } catch (err) {
        res.sendStatus(401).json({message: 'need refresh'})
    }
    
}


  

export { getFastUserInfo, getUserInfo, getUsersOnServer, getUsersFriends };
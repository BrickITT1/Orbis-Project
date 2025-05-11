
import { v4 as uuidv4 } from "uuid";
import jwt from 'jsonwebtoken'

const chats = [
    {
        id: 1,
        name: "My chat 0",
        type: "ls",
        lastmessage: "hi",
        created_at: '',
        updated_at: '',
        owner: 0,
        avatar_url: '/img/icons.png',
        users: [0, 5],
        voice: 1,
    },
    {
        id: 2,
        name: "My chat 1",
        type: "ls",
        lastmessage: "hi",
        created_at: '',
        updated_at: '',
        owner: 1,
        avatar_url: '/img/icon.png',
        users: [1, 2],
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
        owner: 0,
        users: [0, 1],
        voice: 2,
    },
] // Все чаты
const messages = {
    
}; // Сообщения по ID чата (messages[chatId] = [...])

const getChats = async (req, res) => {
    
    const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
    if (!token) return res.sendStatus(401);
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    res.json(chats.filter(val => val.owner == decoded?.id || val.users.includes(decoded.id)))
    //res.json(chats.filter(val => val))  ;
}
  
const postChats = async(req, res) => {
    const newChat = {
      id: uuidv4(),
      name: req.body.name || "New Chat",
      createdBy: "user-1", // Заглушка для пользователя
    };
    chats.push(newChat);
    messages[newChat.id] = [];
    res.status(201).json(newChat);
};

const getInfoChat = async (req, res) => {
    
    const chatId = req.params.id;
    
    res.json(chats.filter(val => val.id == chatId))
    //res.json(chats.filter(val => val))  ;
}

export { chats, getChats, postChats, getInfoChat };
  
// // API для сообщений
// app.get("/api/chats/:id/messages", (req, res) => {
//     const chatMessages = messages[req.params.id] || [];
//     res.json(chatMessages);
//   });
  
// app.post("/api/chats/:id/messages", (req, res) => {
//     const chatId = req.params.id;
//     const newMessage = {
//         id: uuidv4(),
//         body: req.body.body,
//         chatId: chatId,
//         sender: "user-1", // Заглушка для отправителя
//         timestamp: new Date(),
//     };

//     if (!messages[chatId]) messages[chatId] = [];
//     messages[chatId].push(newMessage);

//     // Отправляем сообщение через WebSocket
//     io.to(`chat-${chatId}`).emit("new_message", newMessage);
//     res.status(201).json(newMessage);
// });

// WebSocket логика


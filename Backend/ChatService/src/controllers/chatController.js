
import { v4 as uuidv4 } from "uuid";
import jwt from 'jsonwebtoken';

import { io } from "../server.js";
import { pool } from "../config/db.js";


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

const getMessages = async(req, res) => {
    const client = await pool.connect();
    const chatId = req.params.id

    try {
        const contentsRow = []

        // Получаем историю сообщений      
        const { rows: Messages } = await client.query(
        `SELECT *
        FROM (
        SELECT
            m.id as "message_id",
            m.chat_id,
            m.is_edited,
            mc.type,
            m.reply_to_id,
            m.created_at,
            m.updated_at,
            u.id,
            u.username
        FROM messages m
        JOIN users u ON m.user_id = u.id
        JOIN chats c ON c.id = m.chat_id
        JOIN messages_content mc ON mc.id_messages = m.id
        WHERE m.chat_id = $1
        ORDER BY m.created_at DESC
        LIMIT 20
    ) sub
    ORDER BY sub.created_at ASC;
`,
        [chatId]
        );

        // Получаем содержимое сообщений
        for (let idx = 0; idx < Messages.length; idx++) {
        const messageInside = await client.query(
            `
                SELECT
                mc.type,
                co.id,
                co.text,
                co.url
            from content co
            JOIN messages_content mc ON mc.id_content = co.id
            WHERE mc.id_messages = $1
            `, [Messages[idx].message_id]
        )
            contentsRow.push(messageInside.rows)
        }
        
        const formattedMessages = Messages.map((msg, idx) => ({
            id: msg.message_id,
            chat_id: msg.chat_id,
            user_id: msg.id,
            username: msg.username,
            reply_to_id: msg.reply_to_id,
            is_edited: msg.is_edited,
            content: contentsRow[idx],
            timestamp: new Date(msg.created_at).toLocaleTimeString(),
            updated_at: msg.updated_at ? new Date(msg.updated_at).toLocaleTimeString() : null
        }));

        //io.emit('leave-room',chatId)
        //io.emit('join-room', chatId)

        res.status(200).json(formattedMessages);
    } catch(err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
}

const sendMessages = async(req, res) => {
    const client = await pool.connect();
    const { chat_id, username, content, reply_to_id, user_id } = req.body;
    console.log(req.body)
    try {
        await client.query('BEGIN');
      
        const types = Object.keys(content);
        const values = Object.values(content);
        const contentsRow = []

        for (let idx = 0; idx < types.length; idx++) {
            const content_id = uuidv4();
            let result;
            for (let idx = 0; idx < types.length; idx++) {
    const content_id = uuidv4();

    if (types[idx] === 'file') {
        const result = await client.query(
            `INSERT INTO content (id, url) VALUES ($1, $2) RETURNING id`,
            [content_id, values[idx]]
        );
        contentsRow.push({
            id: result.rows[0].id,
            type: types[idx],
            url: values[idx]
        });
    } else {
        const result = await client.query(
            `INSERT INTO content (id, text) VALUES ($1, $2) RETURNING id`,
            [content_id, values[idx]]
        );
        contentsRow.push({
            id: result.rows[0].id,
            type: types[idx],
            text: values[idx]
        });
    }
}

        }

      

      const message = await client.query(
        `INSERT INTO messages 
        (chat_id, user_id, reply_to_id, is_edited, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, created_at`,
        [chat_id, user_id, reply_to_id || null, false]
      );

      const messageId = message.rows[0].id;

      for (const content of contentsRow) {
        await client.query(
          `INSERT INTO messages_content (id_content, id_messages, type, size, uploaded_at)
          VALUES ($1, $2, $3, $4, NOW())`,
          [content.id, messageId, content.type, null]
        );
      }
      
      const fullMessage = {
        id: messageId,
        chat_id: chat_id,
        user_id: user_id,
        username: username,
        reply_to_id: reply_to_id || null,
        is_edited: false,
        content: contentsRow, // теперь это массив: [{id, type, text}, ...]
        timestamp: new Date(message.rows[0].created_at).toLocaleTimeString(),
        updated_at: null
      };

      
      await client.query('COMMIT');

      io.to(`chat_${chat_id}`).emit('new-message');
        res.status(200).json(fullMessage);
    } catch(err) {
        console.log(err)
        res.status(500).json({ error: "Internal server error" });
    } finally {
        client.release();
    }
}

export { postChats, getInfoChat, getMessages, sendMessages };
  
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


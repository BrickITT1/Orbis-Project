import jwt from 'jsonwebtoken'
import { pool } from "../config/db.js";
import { io } from "../server.js";


// Получить список серверов пользователя
const getServers = async (req, res) => {
    const client = await pool.connect();
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authorization token missing' });
        }

        // jwt.verify либо вернет decoded объект, либо выбросит исключение
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const server = await client.query(
            `SELECT DISTINCT ON (s.id) s.name, s.avatar_url, s.id
            FROM servers s
            JOIN user_server us ON s.id = us.server_id
            JOIN users u ON u.id = us.user_id
            WHERE u.id = $1`,
            [decoded.id]
        );

        return res.json(server.rows);
        
    } catch (err) {
        console.error('Error in getServers:', err);
        
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
};

// Получить список пользователей на сервере
const getFastInfoUserServer = async (req, res) => {
    const serverId = req.params.id
    const client = await pool.connect();

    try {
        const userInfo = await client.query(
        `
            select u.id, u.username, up.avatar_url, up.about from servers s
            JOIN user_server us ON us.server_id = s.id
            JOIN users u ON u.id = us.user_id
            JOIN user_profile up ON up.user_id = u.id 
            WHERE s.id = $1
        `, [serverId])

        res.json(userInfo.rows)
    } catch (err) {
        res.status(401).json({ message: 'need refresh' })
    } finally {
        client.release();
    }
}

// Получить информацию о содержимым на сервере
const getServerInfo = async (req, res) => {
    const client = await pool.connect();
    const serverId = parseInt(req.params.id);

    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const server = await client.query(
            `SELECT * from servers
            where id = $1`,
            [serverId]
        );
        
        if (server.rowCount < 0) {
            return res.status(404).json({ message: 'Server not found' });
        }

        // Get chat details for this server
        const serverChats = 
        await client.query(
            `SELECT c.id AS "chat_id", c.name from server_chats sc
            JOIN chats c ON c.id = sc.id_chats
            where sc.id_server = $1`,
            [serverId]
        );
        const serverVoices = 
        await client.query(
            `SELECT v.id, v.name from server_voice sv
            JOIN voices v ON v.id = sv.id_voice
            where sv.id_server = $1`,
            [serverId]
        );
        const serverInfo = {
            ...server.rows[0],
            chats: serverChats.rows,
            voices: serverVoices.rows
        };

        res.json(serverInfo);
    } catch (err) {
        console.log(err)
        res.status(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
    
}

// Создать сервер
const createServer = async (req, res) => {
    const client = await pool.connect();
    const { name } = req.body;

    try {
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            client.release();
            return res.status(401).json({ message: 'Token is missing' });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            client.release();
            return res.status(401).json({ message: 'Invalid token' });
        }

        await client.query('BEGIN');

        const result = await client.query(
            `INSERT INTO servers 
            (creator_id, name, created_at, updated_at) 
            VALUES ($1, $2, NOW(), NOW()) 
            RETURNING id`,
            [decoded.id, name]
        );

        await client.query(
            `INSERT INTO user_server(user_id, server_id, created_at)
            VALUES ($1, $2, NOW())`, 
            [decoded.id, result.rows[0].id]
        );

        await client.query('COMMIT');

        res.status(200).json({ message: 'Server created successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        
        if (err instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }
        
        console.error('Server creation error:', err);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
};

// Присоединиться в сервер
const joinServer = async (req, res) => {
    const client = await pool.connect();
    const serverId = parseInt(req.params.id);

    try {
        if (!serverId) return res.status(400).json({ message: 'Server ID is required' });
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            client.release();
            return res.status(401).json({ message: 'Token is missing' });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) {
            client.release();
            return res.status(401).json({ message: 'Invalid token' });
        }

        await client.query('BEGIN');

        await client.query(
            `INSERT INTO user_server(user_id, server_id, created_at)
             VALUES ($1, $2, NOW())`, [decoded.id, serverId]
        )

        await client.query('COMMIT');

        res.status(200).json({ message: 'Successfully joined the server' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.sendStatus(401).json({ message: 'need refresh' });
    } finally {
        client.release();
    }
};

// Создать голосовой чат
const createVoice = async (req, res) => {
    const client = await pool.connect();
    const { id } = req.params;

    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);
        
        const server = await client.query(
            `
                SELECT * FROM servers
                WHERE id = $1`,
            [id]
        );

        if (server.rows.length != 1) {
            return res.status(404).json({ message: 'Server not found' });
        };

        await client.query('BEGIN');

        const voice = await client.query(
            `INSERT INTO voices 
            (name, creator_id, created_at) 
            VALUES ($1, $2, NOW()) 
            RETURNING id`,
            ['default voice', decoded.id]
        );

        await client.query(
            `INSERT INTO server_voice(id_server, id_voice)
            VALUES ($1, $2)`, 
            [id, voice.rows[0].id]
        );

        await client.query('COMMIT');
        
        io.to(`server:${id}`).emit('chat-created', { chatId: voice.rows[0].id });
        res.status(200).json({ message: 'Successfully create the chat' });
    } catch (err) {
        await client.query('ROLLBACK');
        res.sendStatus(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
}

// Создать текстовый чат
const createChat = async (req, res) => {
    
    const client = await pool.connect();
    const { id } = req.params;

    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);

        const server = await client.query(
            `
                SELECT * FROM servers
                WHERE id = $1`,
            [id]
        );
        
        if (server.rows.length != 1) {
            return res.status(404).json({ message: 'Server not found' });
        }
        
        await client.query('BEGIN');

        const chat = await client.query(
            `INSERT INTO chats 
            (name, creator_id, created_at) 
            VALUES ($1, $2, NOW()) 
            RETURNING id`,
            ['default chat', decoded.id]
        );

        await client.query(
            `INSERT INTO server_chats(id_server, id_chats)
            VALUES ($1, $2)`, 
            [id, chat.rows[0].id]
        );

        await client.query('COMMIT');
        io.to(`server:${id}`).emit('chat-created', { chatId: chat.rows[0].id });

        res.status(200).json({ message: 'Successfully create the voice' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.log(err)
        res.status(401).json({message: 'Error'})
    } finally {
        client.release();
    }
}

export { getServers, getServerInfo, createServer, joinServer, createVoice, createChat, getFastInfoUserServer };
import { v4 as uuidv4 } from "uuid";
import jwt from 'jsonwebtoken'

import { pool } from "../config/db.js";

  
const getUsersFriends = async (req, res) => {
    const client = await pool.connect();
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);



        const friends = await client.query(`
            SELECT u.*
            FROM users u
            JOIN friend_requests fr
            ON (
                (fr.from_user_id = u.id AND fr.to_user_id = $1) OR
                (fr.to_user_id = u.id AND fr.from_user_id = $1)
                )
            WHERE fr.status = 'accepted';

        `, [ decoded?.id]);

        res.status(200).json(friends.rows);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const getUserInvite = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);


        const friends = await client.query(`
            SELECT u.*
            FROM users u
            JOIN friend_requests fr ON fr.to_user_id = u.id
            WHERE fr.from_user_id = $1 AND fr.status = 'pending';

        `, [ decoded?.id]);
        res.status(200).json(friends.rows);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

const getUsersInviteMe = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);


        const friends = await client.query(`
            SELECT u.*
            FROM users u
            JOIN friend_requests fr ON fr.from_user_id = u.id
            WHERE fr.to_user_id = $1 AND fr.status = 'pending';


        `, [ decoded?.id]);
            console.log(friends.rows)
        res.status(200).json(friends.rows);
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
}; 

const getUserInfo = async (req, res) => {
    const client = await pool.connect();
    const userId = parseInt(req.params.id);

    try {
        const user = await client.query(`
            select u.id, u.username, up.avatar_url, up.about from users u
            JOIN user_profile up ON up.user_id = u.id 
            WHERE u.id = $1
        `, [userId])
    
        res.json(user.rows[0]);
    } catch (err) {
        console.log(err)
        res.status(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
    
}

const getChats = async (req, res) => {
    const client = await pool.connect();
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);

        const chats = await client.query(`
            select u.id, c.name as "username", up.avatar_url, up.about, cu.chat_id from users u
            JOIN user_profile up ON up.user_id = u.id 
            JOIN chat_users cu ON cu.user_id = u.id 
            JOIN chats c ON c.id = cu.chat_id
            WHERE u.id = $1
        `, [decoded.id])
            console.log(chats.rows)
        res.json(chats.rows);
    } catch (err) {
        console.log(err)
        res.status(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
}

const createChat = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);

        await client.query('BEGIN');

        const chat = await client.query(
            `INSERT INTO chats 
            (name, creator_id, created_at) 
            VALUES ($1, $2, NOW()) 
            RETURNING id`,
            ['default chat', decoded.id]
        );

        await client.query(
            `INSERT INTO chat_users(user_id, chat_id)
            VALUES ($1, $2)`, 
            [id, chat.rows[0].id]
        );

        await client.query('COMMIT');
    
        res.json({message: "Create chat succesfull"});
    } catch (err) {
        await client.query('ROLLBACK');
        res.sendStatus(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
}

const startchat = async (req, res) => {
    const client = await pool.connect();
    
    const id_user = req.params.id;
    
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);

        const existingChat = await client.query(`
            SELECT cu1.chat_id, u1.username as "u1" , u2.username as "u2"
FROM chat_users cu1
JOIN chat_users cu2 ON cu1.chat_id = cu2.chat_id
JOIN users u1 ON u1.id = cu1.user_id
JOIN users u2 ON u2.id = cu2.user_id
WHERE cu1.user_id = $1 AND cu2.user_id = $2
        `, [decoded.id, id_user]);

        const {rows: u1} = await client.query(`
            SELECT username from users
            
            WHERE id = $1
            `, [decoded.id])

        const {rows: u2} = await client.query(`
        SELECT username from users
        
        WHERE id = $1
        `, [id_user])

        console.log(`${u1[0].username}, ${u2[0].username}`)

        if (existingChat.rows.length > 0) {
            return res.status(400).json({ 
                message: 'Chat already exists', 
                chatId: existingChat.rows[0].chat_id 
            });
        }

        await client.query('BEGIN');

        const chat = await client.query(
            `INSERT INTO chats 
            (name, creator_id, created_at) 
            VALUES ($1, $2, NOW()) 
            RETURNING id`,
            [`${u1[0].username}, ${u2[0].username}`, decoded.id]
        );

        // Добавление источника запроса
        await client.query(
            `INSERT INTO chat_users(user_id, chat_id)
            VALUES ($1, $2)`, 
            [decoded.id, chat.rows[0].id]
        );

        // Добавление приемника запроса
        await client.query(
            `INSERT INTO chat_users(user_id, chat_id)
            VALUES ($1, $2)`, 
            [id_user, chat.rows[0].id]
        );

        await client.query('COMMIT');
    
        res.json({message: 'Success'});
    } catch (err) {
        await client.query('ROLLBACK');
        console.log(err)
        res.status(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
}

const friendInvite = async (req, res) => {
    const client = await pool.connect();
    
    const id_user = req.params.id;
    
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);

        await client.query('BEGIN');

        // status:1-inv,2-conf,3-black
        await client.query(
            `INSERT INTO friend_requests (from_user_id, to_user_id, status)
            VALUES ($1, $2, 'pending')
            ON CONFLICT DO NOTHING;`,
            [decoded.id, id_user]
        );

        await client.query('COMMIT');
    
        res.json({message: 'Success'});
    } catch (err) {
        await client.query('ROLLBACK');
        console.log(err)
        res.status(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
}

const confirmFriendInvite = async (req, res) => {
    const client = await pool.connect();
    
    const id_user = req.params.id;
    
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);

        await client.query('BEGIN');

        // status:1-inv,2-conf,3-black
        await client.query(
            `UPDATE friend_requests
                SET status = 'accepted'
                WHERE from_user_id = $1 AND to_user_id = $2;
                `,
            [decoded.id, id_user]
        );

        await client.query('COMMIT');
    
        res.json({message: 'Success'});
    } catch (err) {
        await client.query('ROLLBACK');
        console.log(err)
        res.status(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
}

const rejectFriendInvite = async (req, res) => {
    const client = await pool.connect();
    
    const id_user = req.params.id;
    
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.sendStatus(401);

        await client.query('BEGIN');

        await client.query(
            `UPDATE friend_requests
                SET status = 'rejected'
                WHERE from_user_id = 1 AND to_user_id = 2;
                `,
            [decoded.id, id_user]
        );

        await client.query('COMMIT');
    
        res.json({message: 'Success'});
    } catch (err) {
        await client.query('ROLLBACK');
        console.log(err)
        res.status(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
}

const getUserbyName = async (req, res) => {
    const client = await pool.connect();
    const userName = req.query.name;
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.status(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        if (!decoded) return res.status(401);

        const users = await client.query(`
            SELECT u.id, u.username, up.avatar_url
            FROM users u
            JOIN user_profile up ON up.user_id = u.id
            WHERE u.username LIKE $1 || '%'
            LIMIT 10;

        `, [userName])
    
        res.json(users.rows);
    } catch (err) {
        console.log(err)
        res.sendStatus(401).json({message: 'need refresh'})
    } finally {
        client.release();
    }
}
  

export { 
    getUserInfo, 
    getUsersFriends, 
    getUserInvite,
    getChats, 
    createChat, 
    startchat, 
    getUserbyName, 
    friendInvite,
    getUsersInviteMe,
    confirmFriendInvite,
    rejectFriendInvite
 };
import { v4 as uuidv4 } from "uuid";
import jwt from 'jsonwebtoken'
import { pool } from "../config/db";
import { Request, Response } from "express";
import { prisma } from '../config/prismaClient';

  
const getUsersFriends = async (req: Request, res: Response) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    if (!decoded) return res.sendStatus(401);

    const userId = decoded.id;

    const friends = await prisma.users.findMany({
      where: {
        OR: [
          {
            friend_requests_to: {
              some: {
                from_user_id: userId,
                status: 'accepted',
              },
            },
          },
          {
            friend_requests_from: {
              some: {
                to_user_id: userId,
                status: 'accepted',
              },
            },
          },
        ],
      },
    });

    res.status(200).json(friends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserInvite = async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
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

const getUsersInviteMe = async (req: Request, res: Response) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    if (!decoded) return res.sendStatus(401);

    const userId = decoded.id;

    // Получаем пользователей, которые отправили заявку текущему пользователю
    const invites = await prisma.users.findMany({
      where: {
        friend_requests_from: {
          some: {
            to_user_id: userId,
            status: 'pending',
          },
        },
      },
    });

    res.status(200).json(invites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserInfo = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        user_profile: {
          select: {
            avatar_url: true,
            about: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Объединяем данные пользователя и профиля
    const userInfo = {
      id: user.id,
      username: user.username,
      avatar_url: user.user_profile?.avatar_url ?? null,
      about: user.user_profile?.about ?? null,
    };

    res.json(userInfo);
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: 'need refresh' });
  }
};

const getChats = async (req: Request, res: Response) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    if (!decoded) return res.sendStatus(401);

    const chats = await prisma.chat_users.findMany({
      where: {
        user_id: decoded.id,
      },
      select: {
        chat_id: true,
        chats: {
          select: {
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            username: true,
            user_profile: {
              select: {
                avatar_url: true,
                about: true,
              },
            },
          },
        },
      },
    });

    // Преобразуем результат для удобства клиента
    const result = chats.map((item) => ({
      id: item.users.id,
      username: item.chats.name,  // В исходном SQL было c.name AS username — возможно, ошибка, тут исправлено
      avatar_url: item.users.user_profile?.avatar_url ?? null,
      about: item.users.user_profile?.about ?? null,
      chat_id: item.chat_id,
    }));

    res.json(result);
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: 'need refresh' });
  }
};

const createChat = async (req: Request, res: Response) => {
  const { id } = req.body; // id пользователя для добавления в чат

  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    if (!decoded) return res.sendStatus(401);

    // Создаем чат и одновременно добавляем создателя в чат
    const chat = await prisma.$transaction(async (prisma) => {
      const createdChat = await prisma.chats.create({
        data: {
          name: 'default chat',
          creator_id: decoded.id,
          created_at: new Date(),
        },
      });

      // Добавляем пользователя в чат
      await prisma.chat_users.create({
        data: {
          user_id: id,
          chat_id: createdChat.id,
        },
      });

      return createdChat;
    });

    res.json({ message: 'Create chat successful', chatId: chat.id });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'need refresh' });
  }
};

const startchat = async (req: Request, res: Response) => {
    const id_user = parseInt(req.params.id, 10);
    if (isNaN(id_user)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }


  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    if (!decoded) return res.sendStatus(401);

    // Проверяем, есть ли уже чат между двумя пользователями
    const existingChat = await prisma.$queryRaw<{ chat_id: number; u1: string; u2: string }[]>`
      SELECT cu1.chat_id, u1.username as u1, u2.username as u2
      FROM chat_users cu1
      JOIN chat_users cu2 ON cu1.chat_id = cu2.chat_id
      JOIN users u1 ON u1.id = cu1.user_id
      JOIN users u2 ON u2.id = cu2.user_id
      WHERE cu1.user_id = ${Number(decoded.id)} AND cu2.user_id = ${id_user}
    `;

    // Получаем имена пользователей
    const u1 = await prisma.users.findUnique({ where: { id: Number(decoded.id) }, select: { username: true } });
    const u2 = await prisma.users.findUnique({ where: { id: Number(id_user) }, select: { username: true } });

    if (!u1 || !u2) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (existingChat.length > 0) {
      return res.status(400).json({
        message: 'Chat already exists',
        chatId: existingChat[0].chat_id,
      });
    }

    // Создаем чат и добавляем пользователей в транзакции
    const chat = await prisma.$transaction(async (tx) => {
      const createdChat = await tx.chats.create({
        data: {
          name: `${u1.username}, ${u2.username}`,
          creator_id: decoded.id,
          created_at: new Date(),
        },
      });

      await tx.chat_users.createMany({
        data: [
          { user_id: decoded.id, chat_id: createdChat.id },
          { user_id: Number(id_user), chat_id: createdChat.id },
        ],
      });

      return createdChat;
    });

    res.json({ message: 'Success', chatId: chat.id });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'need refresh' });
  }
};

const friendInvite = async (req: Request, res: Response) => {
    const client = await pool.connect();
    
    const id_user = req.params.id;
    
    try {
        const token = req.headers['authorization']?.split(' ')[1]; // Extract token from header
        if (!token) return res.sendStatus(401);
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
        if (!decoded) return res.sendStatus(401);

        const check = await client.query(`SELECT * FROM friend_requests
            WHERE (from_user_id = $1 AND to_user_id = $2)
            OR (from_user_id = $2 AND to_user_id = $1);
        `, [id_user, decoded.id]);

        if (check.rows.length > 0 ) {
            console.log(check.rows)
            return res.status(401).json({message: 'no'})
        }

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

const confirmFriendInvite = async (req: Request, res: Response) => {
  const id_user = Number(req.params.id);

  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    if (!decoded) return res.sendStatus(401);

    // Обновляем статус приглашения
    await prisma.friend_requests.updateMany({
      where: {
        from_user_id: id_user,
        to_user_id: decoded.id,
      },
      data: {
        status: 'accepted',
      },
    });

    res.json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'need refresh' });
  }
};

const rejectFriendInvite = async (req: Request, res: Response) => {
  const id_user = Number(req.params.id);

  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    if (!decoded) return res.sendStatus(401);

    // Удаляем заявку на дружбу
    await prisma.friend_requests.deleteMany({
      where: {
        from_user_id: id_user,
        to_user_id: decoded.id,
      },
    });

    res.json({ message: 'Success' });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'need refresh' });
  }
};


const getUserbyName = async (req: Request, res: Response) => {
  const userName = req.query.name as string;

  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as any;
    if (!decoded) return res.sendStatus(401);

    const users = await prisma.users.findMany({
      where: {
        username: {
          startsWith: userName,
          mode: 'insensitive', // если нужен регистронезависимый поиск
        },
      },
      select: {
        id: true,
        username: true,
        user_profile: {
          select: {
            avatar_url: true,
          },
        },
      },
      take: 10,
    });

    // Преобразуем структуру, если нужно (Prisma вложенность)
    const result = users.map(u => ({
      id: u.id,
      username: u.username,
      avatar_url: u.user_profile?.avatar_url || null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'need refresh' });
  }
};
  

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
import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt, { JwtPayload } from "jsonwebtoken";

import { io } from "../server";
import { pool } from "../config/db";

// Тип для содержимого сообщения
interface ContentItem {
  id: string;
  type: string;
  text?: string;
  url?: string;
}

const getMessages = async (req: Request, res: Response) => {
  const client = await pool.connect();
  const chatId = req.params.id;

  try {
    const contentsRow: ContentItem[][] = [];

    // Получаем историю сообщений      
    const { rows: Messages } = await client.query(
      `
      SELECT *
      FROM (
        SELECT
          m.id as "message_id",
          m.chat_id,
          m.is_edited,
          mc.type,
          m.reply_to_id,
          m.created_at,
          m.updated_at,
          u.id as user_id,
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

    // Получаем содержимое сообщений (content)
    for (let idx = 0; idx < Messages.length; idx++) {
      const messageInside = await client.query(
        `
        SELECT
          mc.type,
          co.id,
          co.text,
          co.url
        FROM content co
        JOIN messages_content mc ON mc.id_content = co.id
        WHERE mc.id_messages = $1
        `,
        [Messages[idx].message_id]
      );
      contentsRow.push(messageInside.rows);
    }

    const formattedMessages = Messages.map((msg, idx) => ({
      id: msg.message_id,
      chat_id: msg.chat_id,
      user_id: msg.user_id,
      username: msg.username,
      reply_to_id: msg.reply_to_id,
      is_edited: msg.is_edited,
      content: contentsRow[idx],
      timestamp: new Date(msg.created_at).toLocaleTimeString(),
      updated_at: msg.updated_at ? new Date(msg.updated_at).toLocaleTimeString() : null,
    }));

    res.status(200).json(formattedMessages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

const sendMessages = async (req: Request, res: Response) => {
  const client = await pool.connect();
  const { chat_id, username, content, reply_to_id, user_id } = req.body;

  try {
    await client.query('BEGIN');

    const types = Object.keys(content);
    const values = Object.values(content);
    const contentsRow: ContentItem[] = [];

    // Здесь был дублированный вложенный цикл — исправил
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
          url: values[idx] as string | undefined
        });
      } else {
        const result = await client.query(
          `INSERT INTO content (id, text) VALUES ($1, $2) RETURNING id`,
          [content_id, values[idx]]
        );
        contentsRow.push({
          id: result.rows[0].id,
          type: types[idx],
          text: values[idx] as string | undefined
        });
      }
    }

    // Создаем запись сообщения
    const message = await client.query(
      `INSERT INTO messages 
       (chat_id, user_id, reply_to_id, is_edited, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, created_at`,
      [chat_id, user_id, reply_to_id || null, false]
    );

    const messageId = message.rows[0].id;

    // Вставляем связи content с message
    for (const content of contentsRow) {
      await client.query(
        `INSERT INTO messages_content (id_content, id_messages, type, size, uploaded_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [content.id, messageId, content.type, null]
      );
    }

    const fullMessage = {
      id: messageId,
      chat_id,
      user_id,
      username,
      reply_to_id: reply_to_id || null,
      is_edited: false,
      content: contentsRow,
      timestamp: new Date(message.rows[0].created_at).toLocaleTimeString(),
      updated_at: null
    };

    await client.query('COMMIT');

    io.to(`chat_${chat_id}`).emit('new-message', fullMessage);
    res.status(200).json(fullMessage);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

const deleteMessage = async (req: Request, res: Response) => {
  const { chat_id, message_id } = req.query;
  const client = await pool.connect();

  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload;
    if (!decoded) return res.sendStatus(401);

    if (!chat_id || !message_id) return res.status(400).json({ message: "Not enough params" });

    await client.query('BEGIN');

    // Удаляем content связанные с сообщением
    const content = await client.query(
      `DELETE FROM messages_content WHERE id_messages = $1 RETURNING id_content`,
      [message_id]
    );

    for (const row of content.rows) {
      await client.query(`DELETE FROM content WHERE id = $1`, [row.id_content]);
    }

    // Удаляем само сообщение
    await client.query(`DELETE FROM messages WHERE id=$2 AND chat_id=$1`, [chat_id, message_id]);

    await client.query('COMMIT');

    io.to(`chat_${chat_id}`).emit('new-message', {});
    res.status(200).json({ message: "Confirm Delete" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

export { getMessages, sendMessages, deleteMessage };

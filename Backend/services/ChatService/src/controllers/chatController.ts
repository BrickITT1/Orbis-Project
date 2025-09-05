import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import jwt, { JwtPayload } from "jsonwebtoken";

import { io } from "../server";
import { pool } from "../config/db";
import { prisma } from "../config/prismaClient";

// Тип для содержимого сообщения
interface ContentItem {
    id: string;
    type: string;
    text?: string;
    url?: string;
}

const getMessages = async (req: Request, res: Response) => {
    const chatId = parseInt(req.params.id);
    const offset = Number(req.query.offset);

    try {
        const messages = await prisma.messages.findMany({
            where: { chat_id: chatId },
            orderBy: { created_at: "desc" },
            take: 20,
            skip: offset * 20,
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                    },
                },
                messages_content: {
                    include: {
                        content: {
                            select: {
                                id: true,
                                text: true,
                                url: true,
                            },
                        },
                    },
                },
            },
        });

        const formatted = messages.reverse().map((msg) => ({
            id: msg.id,
            chat_id: msg.chat_id,
            user_id: msg.user?.id || null,
            username: msg.user?.username || "Unknown",
            reply_to_id: msg.reply_to_id,
            is_edited: msg.is_edited || false,
            content: msg.messages_content.map((mc) => ({
                type: mc.type,
                id: mc.content.id,
                text: mc.content.text ?? "",
                url: mc.content.url ?? "",
            })),
            timestamp: msg.created_at?.toLocaleTimeString() || null,
            updated_at: msg.updated_at?.toLocaleTimeString() || null,
        }));

        res.status(200).json(formatted);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const sendMessages = async (req: Request, res: Response) => {
    const { chat_id, username, content, reply_to_id, user_id } = req.body;
  
    try {
        const types = Object.keys(content);
        const values = Object.values(content);
        console.log(types);
        const contentsRow: any[] = [];

        // Сохраняем content (текст или файл)
        for (let idx = 0; idx < types.length; idx++) {
            const contentId = uuidv4();

            if (types[idx] === "url") {
                const fileUrl = values[idx] as string;
                // Извлечь имя файла из URL, например:
                const urlParts = fileUrl.split("/");
                const fileName = urlParts[urlParts.length - 1]; // последний сегмент URL

                const createdContent = await prisma.content.create({
                    data: {
                        id: contentId,
                        text: fileName, // сохраняем имя файла
                        url: fileUrl,
                    },
                });

                contentsRow.push({
                    id: createdContent.id,
                    type: "url",
                    text: fileName,
                    url: fileUrl,
                });
            } else {
                // для текста
                const textContent = values[idx] as string;
                const createdContent = await prisma.content.create({
                    data: {
                        id: contentId,
                        text: textContent,
                        url: null,
                    },
                });

                contentsRow.push({
                    id: createdContent.id,
                    type: "text",
                    text: textContent,
                    url: null,
                });
            }
        }

        // Создаём сообщение
        const message = await prisma.messages.create({
            data: {
                chat_id: chat_id,
                user_id: user_id,
                reply_to_id: parseInt(reply_to_id) || null,
                is_edited: false,
                created_at: new Date(),
                messages_content: {
                    create: contentsRow.map((content) => ({
                        id_content: content.id,
                        type: content.type,
                        uploaded_at: new Date(),
                        size: null,
                    })),
                },
            },
        });

        const fullMessage = {
            id: message.id,
            chat_id,
            user_id,
            username,
            reply_to_id: message.reply_to_id ? parseInt(`${message.reply_to_id}`) : null,
            is_edited: message.is_edited,
            content: contentsRow,
            timestamp: message.created_at
                ? new Date(message.created_at).toLocaleTimeString()
                : null,
            updated_at: null,
        };

        io.to(`chat_${chat_id}`).emit("new-message", fullMessage);

        res.status(200).json(fullMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

const deleteMessage = async (req: Request, res: Response) => {
    const { chat_id, message_id } = req.query;

    try {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) return res.sendStatus(401);

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
            id: number;
        };
        if (!decoded) return res.sendStatus(401);

        const chatId = parseInt(chat_id as string, 10);
        const messageId = parseInt(message_id as string, 10);

        if (isNaN(chatId) || isNaN(messageId)) {
            return res
                .status(400)
                .json({ message: "Invalid chat_id or message_id" });
        }

        // Проверка, принадлежит ли сообщение пользователю
        const message = await prisma.messages.findUnique({
            where: { id: messageId },
            select: { user_id: true, chat_id: true },
        });

        if (
            !message ||
            message.user_id !== decoded.id ||
            message.chat_id !== chatId
        ) {
            return res.status(403).json({ message: "Forbidden" });
        }

        // Удаляем сообщения и связанные content через messages_content
        await prisma.$transaction(async (tx) => {
            const contentLinks = await tx.messages_content.findMany({
                where: { id_messages: messageId },
                select: { id_content: true },
            });

            // Удалить связи
            await tx.messages_content.deleteMany({
                where: { id_messages: messageId },
            });

            // Удалить content
            const contentIds = contentLinks.map((c) => c.id_content);
            await tx.content.deleteMany({
                where: { id: { in: contentIds } },
            });

            // Удалить само сообщение
            await tx.messages.delete({
                where: { id: messageId },
            });
        });

        io.to(`chat_${chatId}`).emit("delete-message", {
            message_id: messageId,
        });

        return res.status(200).json({ message: "Confirm Delete" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const editMessage = async (req: Request, res: Response) => {
    const { chat_id, message_id } = req.query;

    try {
        const token = req.headers["authorization"]?.split(" ")[1];
        if (!token) return res.sendStatus(401);

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
            id: number;
        };
        if (!decoded) return res.sendStatus(401);

        const chatId = parseInt(chat_id as string, 10);
        const messageId = parseInt(message_id as string, 10);

        if (isNaN(chatId) || isNaN(messageId)) {
            return res
                .status(400)
                .json({ message: "Invalid chat_id or message_id" });
        }

        // Проверка, принадлежит ли сообщение пользователю
        const message = await prisma.messages.findUnique({
            where: { id: messageId },
            include: {
                messages_content: {
                    include: {
                        content: true,
                    },
                },
            },
        });
        if (!message || !message.messages_content.length) {
            // Ошибка - не найдено содержимое
            return res.status(404).json({ message: "Content not found" });
        }

        if (
            !message ||
            message.user_id !== decoded.id ||
            message.chat_id !== chatId
        ) {
            return res.status(403).json({ message: "Forbidden" });
        }
        if (req.method === "PUT") {
            const { content } = req.body;
            if (typeof content !== "string" || !content.trim()) {
                return res.status(400).json({
                    message:
                        "Content is required and must be a non-empty string",
                });
            }

            const contentId = message.messages_content[0].id_content;

            const updatedContent = await prisma.content.update({
                where: { id: contentId },
                data: { text: content },
            });

            
          io.to(`chat_${chat_id}`).emit("new-message");

            return res
                .status(200)
                .json({ message: "Message updated", data: updatedContent });
        }

        // Если метод не PUT — просто возвращаем содержимое для редактирования
        return res
            .status(200)
            .json({ message: "Confirm Edit", data: { content: message } });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error" });
    }
};

export { getMessages, sendMessages, deleteMessage, editMessage };

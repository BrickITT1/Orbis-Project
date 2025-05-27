import express from 'express';

import { postChats, getInfoChat, getMessages, sendMessages } from "../controllers/chatController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const chatRouter = express.Router();

chatRouter.get("/chats/:id/messages", getMessages);
chatRouter.post("/chats/:id/messages", sendMessages)
chatRouter.get("/chat/:id", getInfoChat);
chatRouter.post("/api/chats", postChats)
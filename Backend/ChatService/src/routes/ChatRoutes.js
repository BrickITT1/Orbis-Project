import express from 'express';

import { getChats, postChats, getInfoChat } from "../controllers/chatController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const chatRouter = express.Router();

chatRouter.get("/chats", getChats);
chatRouter.get("/chat/:id", getInfoChat);
chatRouter.post("/api/chats", postChats)
import express from 'express';

import { getChats, postChats } from "../controllers/chatController.js";
import { authenticate } from "../middleware/authMiddleware.js";

export const chatRouter = express.Router();

chatRouter.get("/chats", getChats);
chatRouter.post("/api/chats", postChats)
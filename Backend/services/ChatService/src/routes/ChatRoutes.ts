import express from "express";

import {
    getMessages,
    sendMessages,
    deleteMessage,
    editMessage,
} from "../controllers/chatController";

export const chatRouter = express.Router();

chatRouter.get("/chats/:id/messages", getMessages);
chatRouter.post("/chats/:id/messages", sendMessages);

chatRouter.delete("/message/", deleteMessage);
chatRouter.put("/message/", editMessage);

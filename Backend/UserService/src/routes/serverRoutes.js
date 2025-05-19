import express from 'express';

import { getServers, getServerInfo, createServer, joinServer, createVoice, createChat, getFastInfoUserServer } from "../controllers/serverController.js";

export const serverRouter = express.Router();

serverRouter.get("/server", getServers);
serverRouter.get("/server/:id", getServerInfo);
serverRouter.get("/server/:id/members", getFastInfoUserServer)
serverRouter.post("/server/:id/join", joinServer);
serverRouter.post("/server/:id/voice", createVoice);
serverRouter.post("/server/:id/chat", createChat);
serverRouter.post("/server/", createServer)

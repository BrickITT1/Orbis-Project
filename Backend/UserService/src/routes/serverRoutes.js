import express from 'express';

import { getServers, getServerInfo, createServer } from "../controllers/serverController.js";

export const serverRouter = express.Router();

serverRouter.get("/server", getServers);
serverRouter.get("/server/:id", getServerInfo);
serverRouter.post("/server/", createServer)

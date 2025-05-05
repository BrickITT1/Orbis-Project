import express from 'express';

import { getServers, getServerInfo } from "../controllers/serverController.js";

export const serverRouter = express.Router();

serverRouter.get("/server", getServers);
serverRouter.get("/server/:id", getServerInfo);

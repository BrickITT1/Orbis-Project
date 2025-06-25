import express from "express";
import { joinRoom, leaveRoom, getPeers } from '../controllers/roomController';

export const roomRouter = express.Router();

roomRouter.post('/:roomId/join', joinRoom);
roomRouter.post('/:roomId/leave', leaveRoom);
roomRouter.get('/:roomId/peers', getPeers);



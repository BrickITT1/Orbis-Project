import { roomService } from "../services/roomService";
import { Request, Response } from "express";
import { io } from "../server";

export const joinRoom = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { peerId, userId, username, muted, audioOnly } = req.body;
  try {
    const peer = await roomService.addPeerToRoom(roomId, peerId, userId, username, muted, audioOnly);

    io.to(roomId).emit("newPeer", {
        peerId,
        username,
        muted,
        audioOnly
    });

    res.status(200).json({ peer });
  } catch (error: any) {
      console.log(error)
      res.status(400).json({ error: error.message });
  }
};


export const leaveRoom = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { peerId } = req.body;

  try {
    await roomService.removePeerFromRoom(roomId, peerId);

    io.to(roomId).emit("peerDisconnected", {
      peerId,  
    });
    res.status(200).json({ message: "Left room successfully" });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const getPeers = async (req: Request, res: Response) => {
  const { roomId } = req.params;

  try {
    const peers = await roomService.getPeersInRoom(roomId);
    res.status(200).json({ peers });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

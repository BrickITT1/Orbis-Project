
import { redisClient } from "../config/redis.config";

function getRoomKey(roomId: string) {
  return `room:${roomId}`;
}

function getPeersKey(roomId: string) {
  return `room:${roomId}:peers`;
}

export const roomService = {
  async addPeerToRoom(
    roomId: string,
    peerId: string,
    userId: string,
    username: string,
    muted: string,
    audioOnly: string
  ) {
    if (!roomId || !peerId || !userId || !username) {
      throw new Error("Отсутствуют обязательные параметры");
    }

    const roomKey = getRoomKey(roomId);                   // Hash (room metadata)
    const peersKey = getPeersKey(roomId);                 // Hash: peerId -> peerData
    const userPeersKey = `room:${roomId}:userPeers:${userId}`; // Set: peerId[]
    const usersSetKey = `room:${roomId}:users`;           // Set: userId[]

    // Создаем комнату, если она ещё не существует
    const roomExists = await redisClient.exists(roomKey);
    if (!roomExists) {
      await redisClient.hSet(roomKey, "id", roomId);
    }

    // Проверка на дубликат peerId
    const peerExists = await redisClient.hExists(peersKey, peerId);
    if (peerExists) {
      throw new Error("Пир уже в комнате");
    }

    // Добавляем пира
    const peer = { peerId, userId, username, muted, audioOnly };
    await redisClient.hSet(peersKey, peerId, JSON.stringify(peer));

    // Добавляем userId в список пользователей
    await redisClient.sAdd(usersSetKey, userId);

    // Добавляем peerId в список пиров пользователя
    await redisClient.sAdd(userPeersKey, peerId);

    return peer;
  },

  async removePeerFromRoom(roomId: string, peerId: string) {
    if (!roomId || !peerId) {
      throw new Error("Отсутствуют обязательные параметры");
    }
    const roomKey = getRoomKey(roomId);
    const peersKey = getPeersKey(roomId);

    const roomExists = await redisClient.exists(roomKey);
    if (!roomExists) {
      throw new Error("Комната не найдена");
    }

    const removed = await redisClient.hDel(peersKey, peerId);
    if (removed === 0) {
      throw new Error("Пир не найден в комнате");
    }

    const remainingPeers = await redisClient.hLen(peersKey);
    if (remainingPeers === 0) {
      await redisClient.del(roomKey);
      await redisClient.del(peersKey);
    }
  },

  async getPeersInRoom(roomId: string) {
    if (!roomId) {
      throw new Error("Отсутствует идентификатор комнаты");
    }

    const roomKey = getRoomKey(roomId);
    const peersKey = getPeersKey(roomId);

    const roomExists = await redisClient.exists(roomKey);
    if (!roomExists) {
      throw new Error("Комната не найдена");
    }

    const peersRaw = await redisClient.hVals(peersKey) as string[];
    return peersRaw.map((peerJson) => JSON.parse(peerJson));
  },

  async getPeerFromRoom(roomId: string, peerId: string) {
    if (!roomId || !peerId) {
      throw new Error("Отсутствуют обязательные параметры (roomId или peerId)");
    }


    const peersKey = getPeersKey(roomId);

    const peerRaw = await redisClient.hGet(peersKey, peerId);
    if (!peerRaw) {
      throw new Error("Пир не найден в комнате");
    }

    return JSON.parse(peerRaw);
  },
};

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { useVoiceSocketContext } from "../../../contexts/VoiceSocketContext";
import { debounce, DebouncedFunc  } from "lodash";
import { useLazyGetPeersInRoomQuery } from "../../../features/voice/api/voiceApi";

export const useSocketHandlers = () => {
  const { socket } = useVoiceSocketContext();
  const dispatch = useAppDispatch(); 
  const roomId = useAppSelector((s) => s.voice.roomId);
  const [getPeers, { data, isSuccess }] = useLazyGetPeersInRoomQuery();
  const debouncedUpdatePeersRef = useRef<DebouncedFunc<() => void>>();

  useEffect(() => {
    const updatePeers = async () => {
      if (!socket || !roomId) return;
      try {
        await getPeers(roomId).unwrap();
        console.log("Fetched peers");
      } catch (err) {
        console.error("Failed to update peers:", err);
      }
    };

    debouncedUpdatePeersRef.current = debounce(updatePeers, 500, {
      leading: false,
      trailing: true,
    });

    return () => {
      debouncedUpdatePeersRef.current?.cancel();
    };
  }, [socket, roomId, getPeers]);


  // Обработка сокет-событий
  useEffect(() => {
    if (!socket || !debouncedUpdatePeersRef.current) return;

    const onNewPeer = () => debouncedUpdatePeersRef.current!();
    const onPeerDisconnected = () => debouncedUpdatePeersRef.current!();

    socket.on("newPeer", onNewPeer);
    socket.on("peerDisconnected", onPeerDisconnected);

    return () => {
      socket.off("newPeer", onNewPeer);
      socket.off("peerDisconnected", onPeerDisconnected);
    };
  }, [socket]);

};

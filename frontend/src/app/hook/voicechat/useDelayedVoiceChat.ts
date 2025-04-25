import { useEffect, useState } from "react";
import { useVoiceChat, UseVoiceChatParams } from "./useVoiceChat";


export const useDelayedVoiceChat = (params: UseVoiceChatParams, delay = 2000) => {
    const voiceChat = useVoiceChat(params);
    const [isReady, setIsReady] = useState(false);
  
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, delay);
  
      return () => clearTimeout(timer);
    }, [delay]);
  
    return {
      ...voiceChat,
      isReady,
      // Переопределяем методы, пока не готово
      joinRoom: isReady ? voiceChat.joinRoom : () => Promise.resolve(false),
      mute: isReady ? voiceChat.mute : () => {},
    };
  };
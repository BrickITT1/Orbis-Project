import React, { useEffect, useState } from 'react';
import { useVoiceChat, UseVoiceChatParams } from '../../app/hook/voicechat/useVoiceChat';

interface VoiceChatDelayedProps extends UseVoiceChatParams {
  children: (voiceChat: ReturnType<typeof useVoiceChat>) => React.ReactNode;
  delay?: number;
  fallback?: React.ReactNode;
}

export const VoiceChatDelayed: React.FC<VoiceChatDelayedProps> = ({
  children,
  delay = 2000,
  fallback = <div>Initializing voice chat...</div>,
  ...params
}) => {
  const [isReady, setIsReady] = useState(false);
  const voiceChat = useVoiceChat(params);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  if (!isReady) {
    return <>{fallback}</>;
  }

  return <>{children(voiceChat)}</>;
};
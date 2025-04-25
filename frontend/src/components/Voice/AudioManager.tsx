import React, { useRef, useCallback, useEffect, useMemo } from 'react';

interface AudioManagerProps {
  audioStreams: Record<string, MediaStream>;
  mutedPeers: Record<string, boolean>;
  localPeerId: string;
  onPlaybackError?: (streamId: string, error: Error) => void;
}

const AudioManager: React.FC<AudioManagerProps> = ({
  audioStreams,
  mutedPeers,
  localPeerId,
  onPlaybackError,
}) => {
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Отфильтровываем локальный поток
  const filteredAudioStreams = useMemo(() => {
    return Object.fromEntries(
      Object.entries(audioStreams).filter(
        ([streamId]) => streamId.split('-')[0] !== localPeerId
      )
    );
  }, [audioStreams, localPeerId]);

  const handleError = useCallback(
    (streamId: string, error: Error) => {
      console.warn(`Audio playback failed for stream ${streamId}:`, error);

      onPlaybackError?.(streamId, error);
    },
    [ onPlaybackError]
  );

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(el => {
        if (el) {
          el.pause();
          el.srcObject = null;
        }
      });
      audioRefs.current = {};
    };
  }, []);

  return (
    <>
      {Object.entries(filteredAudioStreams).map(([streamId, stream]) => {
        const peerId = streamId.split('-')[0];
        const isMuted = mutedPeers[peerId] ?? false;

        return (
          <audio
            key={streamId}
            autoPlay
            playsInline
            ref={el => {
              if (el) {
                audioRefs.current[streamId] = el;
                el.srcObject = stream;
                el.muted = isMuted;
                stream.getAudioTracks().forEach(track => {
                  track.enabled = !isMuted;
                });
                el.play().catch(err => handleError(streamId, err));
              } else {
                delete audioRefs.current[streamId];
              }
            }}
            onError={() => handleError(streamId, new Error('Audio element error'))}
          />
        );
      })}
    </>
  );
};

export default React.memo(AudioManager);

import React, { useEffect, useRef } from 'react';
import { useAppDispatch } from '../app/hooks';
import { removeStream } from '../features/voice/voiceSlices';

interface AudioManagerProps {
  audioStreams: Record<string, MediaStream>;
  onPlaybackError?: (streamId: string, error: Error) => void;
}

const AudioManager: React.FC<AudioManagerProps> = ({ 
  audioStreams,
  onPlaybackError 
}) => {
  const dispatch = useAppDispatch();
  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({});

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.srcObject = null;
          audio.pause();
        }
      });
      audioRefs.current = {};
    };
  }, []);

  // Обработчик ошибок воспроизведения
  const handlePlaybackError = (streamId: string, error: Error) => {
    console.warn(`Audio playback failed for stream ${streamId}:`, error);
    dispatch(removeStream(streamId));
    onPlaybackError?.(streamId, error);
  };

  // Очистка удаленных потоков
  useEffect(() => {
    const currentIds = Object.keys(audioStreams);
    const existingIds = Object.keys(audioRefs.current);
    
    existingIds.forEach(id => {
      if (!currentIds.includes(id)) {
        const audioElement = audioRefs.current[id];
        if (audioElement) {
          audioElement.srcObject = null;
          audioElement.pause();
        }
        delete audioRefs.current[id];
      }
    });
  }, [audioStreams]);

  return (
    <>
      {Object.entries(audioStreams).map(([streamId, stream]) => (
        <audio
          key={`audio-${streamId}`}
          autoPlay
          playsInline
          data-stream-id={streamId}
          ref={(audioElement) => {
            if (audioElement) {
              audioRefs.current[streamId] = audioElement;
              if (audioElement.srcObject !== stream) {
                audioElement.srcObject = stream;
                audioElement.play()
                  .catch(error => handlePlaybackError(streamId, error));
              }
            } else {
              delete audioRefs.current[streamId];
            }
          }}
          onEnded={() => dispatch(removeStream(streamId))}
          onError={() => handlePlaybackError(streamId, new Error('Audio element error'))}
        />
      ))}
    </>
  );
};

export default React.memo(AudioManager);
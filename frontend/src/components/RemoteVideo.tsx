// RemoteVideo.tsx
import React, { useEffect, useRef } from 'react';

interface RemoteVideoProps {
  stream: MediaStream;
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ stream }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Подаём поток в <video>
    video.srcObject = stream;
    video.muted = true;
    video.volume = 0;

    // Пробуем автозапуск (многие браузеры блокируют звук до взаимодействия)
    video.play().catch(err => {
      console.warn('Не удалось autoplay — поток запущен в muted-режиме', err);
    });

    // При размонтировании просто отвязываем srcObject (не трогаем сами треки)
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      style={{ width: '200px', borderRadius: '8px', margin: '0.5rem' }}
    />
  );
};

export default RemoteVideo;

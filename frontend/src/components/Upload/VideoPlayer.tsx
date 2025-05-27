// components/VideoPlayer.tsx
import React from 'react';

type Props = {
  src: string;
};

const VideoPlayer: React.FC<Props> = ({ src }) => {
  return (
    <video
      src={src}
      controls
      width="100%"
      style={{ borderRadius: '12px', maxWidth: 600 }}
    />
  );
};

export default VideoPlayer;

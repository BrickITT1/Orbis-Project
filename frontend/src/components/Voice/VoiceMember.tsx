import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PeerInfo } from "../../types/Channel";
import { useAppSelector } from "../../app/hooks";
import { useMediaStreamContext } from "../../contexts/MediaStreamContext";
import { useLocalMedia } from "../../hooks/useLocalMedia";

type TypeMember = "chat" | "server";

interface VoiceMemberProps {
  typeMember: TypeMember;
}

export const VoiceMember: React.FC<VoiceMemberProps> = ({
  typeMember,
}) => {
  const myPeer = useAppSelector((s) => s.voice.myPeer);
  const roomPeers = useAppSelector((s) => s.voice.roomPeers);
  const audioOnly = myPeer?.audioOnly ?? false;
  const { localStreamRef, remoteStreams } = useMediaStreamContext();
  const stream = localStreamRef.current;

  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  const [userMediaError, setUserMediaError] = useState<Error | null>(null);
  const { initLocalMedia, stopLocalMedia } = useLocalMedia();

  useEffect(() => {
  const videoEl = localVideoRef.current;
  if (videoEl) {
    if (!audioOnly && stream) {
      videoEl.srcObject = stream;
    } else {
      videoEl.srcObject = null;
    }
  }
}, [stream, audioOnly]);

  useEffect(() => {
    roomPeers.forEach((peer) => {
      const isMe = peer.id === myPeer?.id;
      if (!isMe) {
        const videoEl = remoteVideoRefs.current[peer.id];
        const remoteStream = remoteStreams[peer.id];
        if (videoEl && remoteStream) {
          videoEl.srcObject = remoteStream;
        }
      }
    });
  }, [remoteStreams, roomPeers, myPeer?.id]);
 
  useEffect(() => {
    if (!audioOnly) {
      initLocalMedia().catch(setUserMediaError);
    } else {
      stopLocalMedia();
    }
  }, [roomPeers, audioOnly]);

  if (!roomPeers.length) {
    return <div>
      <video
                ref={localVideoRef}
                autoPlay
                muted // важно: иначе браузер может блокировать воспроизведение
                playsInline
                width={"300px"}
                height={"300px"}
                className="rounded-xl w-full max-w-md shadow-lg"
              />
    </div>;
  }

  if (typeMember === "server") {
    return (
      <ul>
        {roomPeers.map((peer) => (
          <li key={peer.id}>
            <span>
              <img src="/img/icon.png" alt="" width={30} height={30} />
            </span>
            {peer.username}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {roomPeers.map((peer, idx) => {
        const isMe = peer.id === myPeer?.id;
        const hasVideo = peer.audioOnly;
        const inRoomVideo = Object.keys(remoteStreams);
        console.log( inRoomVideo[0].includes(peer.id))

        if (isMe) return (
          <li key={peer.id}>
              <div className="voice-avatar">
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted // важно: иначе браузер может блокировать воспроизведение
                  playsInline
                  className={!hasVideo ? "hidden" : "w-full h-full object-cover"}
                /> 
              <div className={hasVideo ? "hidden" : ""}><img src="/img/icon.png" alt="icon" /></div>
            </div>
            
            <div className="voice-name">
              {peer.username}
              {peer.muted && " (muted)"}
              {" (You)"}
              {userMediaError && (
                <span className="error-text"> (Camera error)</span>
              )}
            </div>
          </li>
        )

        return (
          <li key={peer.id}>
            <div className="voice-avatar">
              <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={!hasVideo ? "hidden" : "w-full h-full object-cover"}
              />
              <div className={hasVideo ? "hidden" : ""}><img src="/img/icon.png" alt="icon" /></div>
            </div>
            
            <div className="voice-name">
              {peer.username}
              {peer.muted && " (muted)"}
            </div>
          </li>
        );
      })}
    </>
  );
};

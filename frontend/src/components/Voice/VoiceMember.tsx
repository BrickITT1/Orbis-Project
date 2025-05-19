import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { PeerInfo } from "../../types/Channel";
import { useAppSelector } from "../../app/hooks";

type TypeMember = "chat" | "server";

interface VoiceMemberProps {
  typeMember: TypeMember;
  videoStreams: Record<string, MediaStream>;
}

export const VoiceMember: React.FC<VoiceMemberProps> = ({
  typeMember,
  videoStreams = {},
}) => {
  const isConnected = useAppSelector((s) => s.voice.isConnected);
  const myPeer = useAppSelector((s) => s.voice.myPeer);
  const roomPeers = useAppSelector((s) => s.voice.roomPeers);
  const audioOnly = myPeer?.audioOnly ?? false;

  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const [userMediaError, setUserMediaError] = useState<Error | null>(null);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }
  }, []);

  const initLocalStream = useCallback(async () => {
    if (!myPeer?.id || typeMember !== "chat") return;

    stopLocalStream();
    setUserMediaError(null);

    const constraints = {
      video: !audioOnly,
      audio: false,
    };

    if (!constraints.audio && !constraints.video) {
      console.warn("Skipped getUserMedia: both audio and video are false");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!audioOnly && stream.getVideoTracks().length === 0) {
        throw new Error("No video track available");
      }

      localStreamRef.current = stream;

      const videoEl = videoRefs.current[myPeer.id];
      if (videoEl) {
        videoEl.muted = true;
        videoEl.srcObject = null;
        videoEl.srcObject = stream;

        setTimeout(() => {
          videoEl.play().catch((e) => {
            console.warn("Auto-play prevented (local):", e);
          });
        }, 0);
      }
    } catch (err) {
      console.error("Media error:", err);
      setUserMediaError(err as Error);
      stopLocalStream();
    }
  }, [myPeer?.id, audioOnly, typeMember, stopLocalStream]);

  useEffect(() => {
    if (isConnected && typeMember === "chat") {
      initLocalStream();
    }

    return () => {
      stopLocalStream();
    };
  }, [isConnected, typeMember, initLocalStream, stopLocalStream]);

  useEffect(() => {
    if (!myPeer?.id || typeMember !== "chat") return;

    const videoEl = videoRefs.current[myPeer.id];
    const stream = localStreamRef.current;

    if (videoEl && stream) {
      if (videoEl.srcObject !== stream) {
        videoEl.muted = true;
        videoEl.srcObject = null;
        videoEl.srcObject = stream;

        setTimeout(() => {
          videoEl.play().catch((e) => {
            console.warn("Auto-play prevented:", e);
          });
        }, 0);
      }
    }
  }, [myPeer?.id, typeMember, localStreamRef.current]);

  const attachRemoteStream = async (stream: MediaStream, peerId: string) => {
    const videoEl = videoRefs.current[peerId];
    if (!videoEl) {
      console.warn("No video element for peer", peerId);
      return;
    }

    videoEl.muted = true;
    videoEl.srcObject = null;
    videoEl.srcObject = stream;

    try {
      await videoEl.play();
    } catch (err) {
      console.warn("Remote video play failed (1), retrying with muted:", err);
      try {
        await videoEl.play();
      } catch (err2) {
        console.error("Remote video still failed to play (2):", err2);
      }
    }
  };

  useEffect(() => {
    if (typeMember !== "chat") return;

    roomPeers.forEach((peer) => {
      if (peer.id === myPeer?.id) return;

      const streamKey = Object.keys(videoStreams).find((key) =>
        key.includes(peer.id)
      );
      const stream = streamKey ? videoStreams[streamKey] : null;
      const videoEl = videoRefs.current[peer.id];

      if (videoEl) {
        if (stream && !peer.audioOnly) {
          if (videoEl.srcObject !== stream) {
            console.log("Attaching stream for peer", peer.id);
            attachRemoteStream(stream, peer.id);
          }
        } else {
          videoEl.srcObject = null;
        }
      }
    });
  }, [videoStreams, roomPeers, myPeer?.id, typeMember]);

  if (!roomPeers.length) {
    return <div>Loading...</div>;
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
    <ul>
      {roomPeers.map((peer) => {
        const isMe = peer.id === myPeer?.id;
        const shouldShowVideo =
          !peer.audioOnly &&
          (isMe
            ? !audioOnly && localStreamRef.current
            : Object.keys(videoStreams).some((key) => key.includes(peer.id)));

        return (
          <li key={peer.id}>
            <div className="voice-avatar">
              {!shouldShowVideo ? (
                <img
                  src="/img/icon.png"
                  alt={`${peer.username} avatar`}
                  width={150}
                  height={150}
                />
              ) : (
                <video
                  ref={(el) => {
                    videoRefs.current[peer.id] = el;
                    if (el && isMe && localStreamRef.current) {
                      el.muted = true;
                      el.srcObject = null;
                      el.srcObject = localStreamRef.current;
                      setTimeout(() => {
                        el.play().catch((e) => {
                          console.warn("Auto-play error on ref (me):", e);
                        });
                      }, 0);
                    }
                  }}
                  autoPlay
                  muted={isMe}
                  playsInline
                  style={{
                    width: 200,
                    height: "auto",
                    borderRadius: 8,
                    margin: "10px 0",
                    backgroundColor: "black",
                  }}
                />
              )}
            </div>
            <div className="voice-name">
              {peer.username}
              {peer.muted && " (muted)"}
              {isMe && " (You)"}
              {isMe && userMediaError && (
                <span className="error-text"> (Camera error)</span>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
};

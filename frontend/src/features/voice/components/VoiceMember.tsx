import React, { useEffect, useRef, useState } from "react";
import { PeerInfo, VoiceMemberProps } from "../types/voice.types";
import { useAppSelector } from "@/app/hooks";
import { useMediaStreamContext } from "@/contexts/MediaStreamContext";
import { useLocalMedia } from "../hooks/useLocalMedia";
import { RemoteVideo } from "./Video/RemoteVideo"
import { useSetterAudioOnly, useSetterMute } from "../hooks/voiceAction";

export const VoiceMember: React.FC<VoiceMemberProps> = ({ typeMember }) => {
  const myPeer = useAppSelector((s) => s.voice.myPeer);
  const roomPeers = useAppSelector((s) => s.voice.roomPeers);
  const audioOnly = myPeer?.audioOnly ?? false;
  
  const { localAudioRef, localVideoRef, remoteAudioStreams, remoteVideoStreams } = useMediaStreamContext();

  const localVideoElementRef = useRef<HTMLVideoElement>(null);
  const [userMediaError, setUserMediaError] = useState<Error | null>(null);
  const { initLocalMedia, stopLocalMedia } = useLocalMedia();
  useSetterAudioOnly();
  useSetterMute();

  useEffect(() => {
    console.log("Checking remote streams...");
    console.log(`Audio keys: ${Object.keys(remoteAudioStreams)}`);
    console.log(`Video keys: ${Object.keys(remoteVideoStreams)}`);
  }, [remoteVideoStreams, remoteAudioStreams]);

  useEffect(() => {
    if (localVideoElementRef.current) {
      if (!audioOnly && localVideoRef.current) {
        localVideoElementRef.current.srcObject = localVideoRef.current;
      } else {
        localVideoElementRef.current.srcObject = null;
      }
    }
  }, [localVideoRef.current, audioOnly]);

  useEffect(() => {
    if (!audioOnly) {
      initLocalMedia().catch(setUserMediaError);
    } else {
      stopLocalMedia();
    }
  }, [audioOnly, roomPeers, initLocalMedia, stopLocalMedia]);

  // Функция для поиска видео потока для пира по префиксу peer.id
  const findVideoStreamForPeer = (peerId: string): MediaStream | null => {
    const videoKey = Object.keys(remoteVideoStreams).find((key) => key.startsWith(peerId));
    return videoKey ? remoteVideoStreams[videoKey] : null;
  };

  if (!roomPeers.length && !myPeer.peerId) return null

  if (!roomPeers.length) {
    return (
      <>
        Подключение
      </>
    );
  }

  if (typeMember === "server") {
    return (
      <>
        {roomPeers.map((peer) => (
          <li key={peer.peerId}>
            <span>
              <img src="/img/icon.png" alt="" width={30} height={30} />
            </span>
            {peer.username}
          </li>
        ))}
      </>
    );
  }
  

  return (
    <>
      {roomPeers.map((peer) => {
        const isMe = peer.peerId === myPeer?.peerId;
        
        if (isMe) {
          const hasVideo = !myPeer.audioOnly;
          //console.log(hasVideo)
          return (
            <li key={myPeer.peerId}>
              <div className="" >
                <video
                  ref={localVideoElementRef}
                  autoPlay
                  muted
                  playsInline
                  className="rounded-xl w-40 h-30 shadow-lg"
                  style={{
                    display: hasVideo ? "block" : "none",
                  }}
                />
                {!hasVideo && (
                  <img
                    src="/img/icon.png"
                    alt="icon"
                    className="w-30 h-30"
                  />
                )}
              </div>
              <div className="flex justify-center gap-5">
                <div className="name-text">{myPeer.username}</div>
                
                {myPeer.muted && <span><svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M34 20V11.5001C34 5.97722 29.5228 1.50008 24 1.50008C21.6015 1.50008 19.4002 2.3445 17.6771 3.7523M4 24V26.5C4 37.5458 12.9543 46.5 24 46.5C30.1633 46.5 35.6752 43.7122 39.344 39.329M1.5 1.5L46.5 46.5M24 36.5C18.4771 36.5 14 32.023 14 26.5V14.0001L32.2037 32.22C30.3962 34.8075 27.3957 36.5 24 36.5Z" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                </svg></span>}
                {!myPeer.audioOnly && 
                  <span> <svg width="20" height="20" viewBox="0 0 48 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M35.693 26L46 31C46 31 47.25 26 47.25 18.5C47.25 11 46 6 46 6L35.693 11M35.693 26C35.8845 23.7485 36 21.182 36 18.5C36 15.818 35.8845 13.2515 35.693 11M35.693 26C35.3295 30.2777 34.6925 33.4185 34.0555 34.0555C33.0833 35.0278 26.2777 36 18.5 36C10.7222 36 3.91668 35.0278 2.94445 34.0555C1.97223 33.0833 1 26.2777 1 18.5C1 10.7222 1.97223 3.91668 2.94445 2.94445C3.91668 1.97223 10.7222 1 18.5 1C26.2777 1 33.0833 1.97223 34.0555 2.94445C34.6925 3.5814 35.3295 6.72228 35.693 11" stroke="white" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg></span>}
                
                
                {userMediaError && <span className="error-text"> (Camera error)</span>}
              </div>
            </li>
          );
        }

        const stream = findVideoStreamForPeer(peer.peerId);
       

        return <RemoteVideo key={peer.peerId} peer={peer} stream={stream} />;
      })}
    </>
  );
};

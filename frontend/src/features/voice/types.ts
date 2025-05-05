import { EntityState } from "@reduxjs/toolkit";
// types.ts
export type StreamInfo = {
    audio?: MediaStream;
    video?: MediaStream;
};

// types.ts
export type PeerInfo = {
    id: string;
    username: string;
    connected: boolean; // true = в чате
    muted: boolean; // true = микрофон выключен
    audioOnly: boolean;
    speaking?: boolean; // true = сейчас говорит
};

export type VoiceState = {
    localStreams: StreamInfo;
    remoteStreams: Record<string, StreamInfo>;
    joined: boolean;
    connecting: boolean;
    error: string | null;
    peers: EntityState<PeerInfo>; // <-- вот так правильно
    currentRoom: number | undefined;
};

export type statusVoice = 'idle' | 'connecting' | 'connected' | 'error' | 'disconnecting' | 'disconnected' | 'needdisc' | 'needconn'

export interface VoiceState {
    roomPeers: PeerInfo[];
    status: statusVoice;
    roomId: string | null;
    myPeer: PeerInfo;
    bigMode: boolean;
}

export interface Info {
    isConnected: boolean;
    roomId: string | null;
}

export interface PeerInfo {
    userId: string;
    peerId: string;
    username: string;
    muted?: boolean;
    audioOnly: boolean;
}

export interface ProducerInfo {
    id: string;
    kind: "audio" | "video";
    peerId: string;
    change: boolean;
}

export interface ConsumerInfo {
    id: string;
    producerId: string;
    kind: "audio" | "video";
    rtpParameters: any;
    peerId: string;
}


export type TypeMember = "chat" | "server";

export interface VoiceMemberProps {
  typeMember: TypeMember;
}

export interface RemoteVideoProps {
  peer: PeerInfo;
  stream: MediaStream | null;
}
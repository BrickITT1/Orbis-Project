export interface PeerInfo {
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

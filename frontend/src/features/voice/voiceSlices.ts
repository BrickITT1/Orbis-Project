import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PeerInfo } from "../../types/Channel";
import { voiceApi } from "../../services/voice";

interface VoiceState {
    roomPeers: PeerInfo[];
    status: 'idle' | 'connecting' | 'connected' | 'error' | 'disconnecting' | 'disconnected' | 'needdisc' | 'needconn';
    roomId: string | null;
    myPeer: PeerInfo;
    bigMode: boolean
}

interface Info {
    isConnected: boolean;
    roomId: string | null;
}

const initialState: VoiceState = {
    roomPeers: [],
    status: 'idle',
    roomId: null,
    myPeer: {
        peerId: "",
        username: "",
        audioOnly: true,
        userId: "",
    },
    bigMode: false,

};

export const voiceSlice = createSlice({
    name: "voice",
    initialState,
    reducers: {
        setPeers: (state, action: PayloadAction<PeerInfo[]>) => {
            state.roomPeers = action.payload;
        },
        setMyPeer: (state, action: PayloadAction<PeerInfo>) => {
            state.myPeer = action.payload;
        },
        setChat: (state, action: PayloadAction<string>) => {
            state.roomId = action.payload;
        },
        setPeerId: (state, action: PayloadAction<string>) => {
            state.myPeer.peerId = action.payload
        },
        setAudioOnlyMyPeer: (state, action: PayloadAction<boolean>) => {
            state.myPeer.audioOnly = action.payload
        },
        setToggleJoin: (state, action: PayloadAction<Info>) => {
             state.roomId = action.payload.roomId;
        },
        resetVoiceState: (state) => {
            state.roomPeers = [];
            state.status = 'idle';
            state.roomId = null;
        },
        setBigMode: (state, action: PayloadAction<boolean>) => {
            state.bigMode = action.payload
        },
        setStatus: (state, action: PayloadAction<'idle' | 'connecting' | 'connected' | 'error' | 'disconnecting' | 'disconnected' | 'needdisc' | 'needconn'>) => {
            state.status = action.payload
        },
    },
     extraReducers: (builder) => {
        // Обработка состояний для регистрации и авторизации
        builder
            .addMatcher(
                voiceApi.endpoints.getPeersInRoom.matchFulfilled,
                (state, action) => {
                    console.log(action)
                    state.roomPeers = Object.values(action.payload)
                },
            )
            .addMatcher(
                voiceApi.endpoints.getPeersInRoom.matchRejected,
                (state, action) => {
                    state.roomPeers = []
                },
            )
                
        },
});

export const {
    setPeers,
    resetVoiceState,
    setMyPeer,
    setChat,
    setAudioOnlyMyPeer,
    setBigMode,
    setPeerId,
    setStatus
} = voiceSlice.actions;

export default voiceSlice.reducer;

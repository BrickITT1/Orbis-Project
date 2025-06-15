import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PeerInfo } from "../../types/Channel";
import { voiceApi } from "../../services/voice";

interface VoiceState {
    roomPeers: PeerInfo[];
    isConnected: boolean;
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
    isConnected: false,
    roomId: null,
    myPeer: {
        peerId: "",
        username: "",
        audioOnly: true,
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
        setToggleJoin: (state, action: PayloadAction<Info>) => {
            state.isConnected = action.payload.isConnected;
        },
        setChat: (state, action: PayloadAction<string | null>) => {
            state.roomId = action.payload;
            state.isConnected = true;
        },
        setMyPeer: (state, action: PayloadAction<PeerInfo>) => {
            state.myPeer = action.payload;
        },
        setAudioOnlyMyPeer: (state, action: PayloadAction<boolean>) => {
            state.myPeer.audioOnly = action.payload
        },
        resetVoiceState: (state) => {
            state.roomPeers = [];
            state.isConnected = false;
            state.roomId = null;
        },
        setBigMode: (state, action: PayloadAction<boolean>) => {
            state.bigMode = action.payload
        }
    },
     extraReducers: (builder) => {
        // Обработка состояний для регистрации и авторизации
        builder
            .addMatcher(
                voiceApi.endpoints.getPeersInRoom.matchFulfilled,
                (state, action) => {
                    state.roomPeers = action.payload.peers
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
    setToggleJoin,
    setChat,
    resetVoiceState,
    setMyPeer,
    setAudioOnlyMyPeer,
    setBigMode
} = voiceSlice.actions;

export default voiceSlice.reducer;

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PeerInfo } from "../../types/Channel";

interface VoiceState {
    roomPeers: PeerInfo[];
    isConnected: boolean;
    roomId: number | null;
    myPeer: PeerInfo;
}

interface Info {
    isConnected: boolean;
    roomId: number | null;
}

const initialState: VoiceState = {
    roomPeers: [],
    isConnected: false,
    roomId: null,
    myPeer: {
        id: "",
        username: "",
        audioOnly: true,
    },
};

export const voiceSlice = createSlice({
    name: "voice",
    initialState,
    reducers: {
        setPeers: (state, action: PayloadAction<PeerInfo[]>) => {
            state.roomPeers = action.payload;
        },
        setToggleJoin: (state, action: PayloadAction<Info>) => {
            console.log(action)
            state.isConnected = action.payload.isConnected;
            state.roomId = action.payload.roomId;
        },
        setChat: (state, action: PayloadAction<number | null>) => {
            state.roomId = action.payload;
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
    },
});

export const {
    setPeers,
    setToggleJoin,
    setChat,
    resetVoiceState,
    setMyPeer,
    setAudioOnlyMyPeer
} = voiceSlice.actions;

export default voiceSlice.reducer;

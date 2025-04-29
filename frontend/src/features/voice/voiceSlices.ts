import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PeerInfo } from '../../types/Channel';

interface VoiceState {
  roomPeers: PeerInfo[];
  mutedPeers: Record<string, boolean>;
  isConnected: boolean;
  roomId: number | null;
  myPeer: PeerInfo;
}

const initialState: VoiceState = {
  roomPeers: [],
  mutedPeers: {},
  isConnected: false,
  roomId: null,
  myPeer: {
    id: '',
    username: '',
    audioOnly: false
  }
};

export const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    setPeers: (state, action: PayloadAction<PeerInfo[]>) => {
      state.roomPeers = action.payload;
    },
    setMuted: (state, action: PayloadAction<{ peerId: string; muted: boolean }>) => {
      state.mutedPeers[action.payload.peerId] = action.payload.muted;
    },
    setJoin: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
    },
    setChat: (state, action: PayloadAction<number | null>) => {
      state.roomId = action.payload;
    },
    setMyPeer: (state, action: PayloadAction<PeerInfo>) => {
      state.myPeer = action.payload;
    },
    resetVoiceState: (state) => {
      state.roomPeers = [];
      state.mutedPeers = {};
      state.isConnected = false;
      state.roomId = null;
    },
  },
});

export const {
  setPeers,
  setMuted,
  setJoin,
  setChat,
  resetVoiceState,
  setMyPeer
} = voiceSlice.actions;

export default voiceSlice.reducer;

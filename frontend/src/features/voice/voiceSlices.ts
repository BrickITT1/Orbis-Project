// features/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PeerInfo } from '../../types/Channel';

interface AudioStream {
  id: string;
  stream: MediaStream | null;
  isPlaying: boolean;
}

interface AudioState {
  streams: AudioStream[];
  joined: boolean;
  chat: number | undefined;
  peers: PeerInfo[];
  audioOnly: boolean;
}

const initialState: AudioState = {
  joined: false,
  chat: undefined,
  streams: [],
  peers: [],
  audioOnly: true,
};

const voiceSlice = createSlice({
  name: 'voice',
  initialState,
  reducers: {
    setJoin(state, action: PayloadAction<boolean>) {
      state.joined = action.payload;
    },
    setChat(state, action: PayloadAction<number | undefined>) {
      state.chat = action.payload;
    },
    setCurrentRoom: (state, action: PayloadAction<number | undefined>) => {
      state.chat = action.payload;
    },
    setPeers(state, action: PayloadAction<PeerInfo[]>) {
      state.peers = action.payload;
    },
    setAudioOnly(state, action: PayloadAction<boolean>) {
      state.audioOnly = action.payload;
    }
  },
});

export const {
  setJoin,
  setChat,
  setCurrentRoom, 
  setPeers,
  setAudioOnly
} = voiceSlice.actions;

export default voiceSlice.reducer;
// features/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AudioStream {
  id: string;
  stream: MediaStream | null;
  isPlaying: boolean;
}

interface AudioState {
  streams: AudioStream[];
  joined: boolean;
  chat: number | undefined;
}

const initialState: AudioState = {
  joined: false,
  chat: undefined,
  streams: [],
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
    addStream: (state, action: PayloadAction<{id: string; stream: MediaStream}>) => {
      const existing = state.streams.find(s => s.id === action.payload.id);
      if (!existing) {
        state.streams.push({
          id: action.payload.id,
          stream: action.payload.stream,
          isPlaying: false,
        });
      }
    },
    removeStream: (state, action: PayloadAction<string>) => {
      state.streams = state.streams.filter(s => s.id !== action.payload);
    },
    setPlaying: (state, action: PayloadAction<{id: string; playing: boolean}>) => {
      const stream = state.streams.find(s => s.id === action.payload.id);
      if (stream) {
        stream.isPlaying = action.payload.playing;
      }
    },
    setCurrentRoom: (state, action: PayloadAction<number | undefined>) => {
      state.chat = action.payload;
    },
    clearAllStreams: (state) => {
      state.streams.forEach(s => {
        s.stream?.getTracks().forEach(track => track.stop());
      });
      state.streams = [];
      state.chat = undefined;
    },
  },
});

export const {
  setJoin,
  setChat,
  addStream, 
  removeStream, 
  setPlaying, 
  setCurrentRoom, 
  clearAllStreams
} = voiceSlice.actions;

export default voiceSlice.reducer;
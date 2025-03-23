// features/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { messageApi } from '../../services/chat';

export interface chat {
  id: number;
  name: string;
  type: string;
  lastmessage: string;
  created_at: string;
  updated_at: string;
  avatar_url: string;
  creator: number;
  own: number;
}

interface chatState {
  chat: chat[];
  activeChat: chat;
}

const initialState: chatState = {
  chat: [
    {
      id: 1,
      name: "My chat",
      type: "ls",
      lastmessage: "hi",
      created_at: '',
      updated_at: '',
      avatar_url: '/img/icon.png',
      creator: 0,
      own: 5,
    }
  ],
  activeChat: {
    id: 1,
    name: "My chat",
    type: "ls",
    lastmessage: "hi",
    created_at: '',
    updated_at: '',
    avatar_url: '/img/icon.png',
    creator: 0,
    own: 5,
  }
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    // Авторизация
    
    // loginSuccess(state, action: PayloadAction<UserData>) {
    //   state.user = action.payload;
    //   state.isAuthenticated = true;
    //   state.loading = false;
    //   console.log(action.payload)
    // },
    setActiveChat(state, action: PayloadAction<chat>) {
      state.activeChat = action.payload;
    }

  },
  extraReducers: (builder) => {
    // Обработка состояний для регистрации и авторизации
    builder
      .addMatcher(
        messageApi.endpoints.GetChats.matchFulfilled, 
        (state, action) => {
          state.chat = action.payload;
        }
      )
      .addMatcher(
        messageApi.endpoints.GetMessages.matchPending,
        (state) => {
        }
      )
      .addMatcher(
        messageApi.endpoints.CreateChat.matchPending,
        (state) => {
        }
      )
      .addMatcher(
        messageApi.endpoints.CreateMessages.matchFulfilled,
        (state, action) => {
          
        }
      )
    
  },
});

export const {
  setActiveChat
} = chatSlice.actions;

export default chatSlice.reducer;
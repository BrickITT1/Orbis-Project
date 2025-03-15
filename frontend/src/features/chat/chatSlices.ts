// features/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { messageApi } from '../../services/chat';

interface chat {
  name: string;
  lastmessage: string;
  lastmessages: string[];
  avatar: string;
  isGroup: boolean;
  chat_id: number;
}

interface chatState {
  chat: chat[];
  activeChat: number;
}

const initialState: chatState = {
  chat: [{
    name: "My chat",
    lastmessage: "hi",
    lastmessages: ["hi", "hihi"],
    avatar: '/img/icon.png',
    isGroup: false,
    chat_id: 0
  }],
  activeChat: 0
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
    setActiveChat(state, action: PayloadAction<number>) {
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
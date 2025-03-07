// features/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { messageApi } from '../../services/chat';

interface chat {
  name: string;
  lastmessage: string;
  lastmessages: string[];
  avatar: string;
  isGroup: boolean;
}

interface chatState {
  chat: chat[];
}

const initialState: chatState = {
  chat: [{
    name: "My chat",
    lastmessage: "hi",
    lastmessages: ["hi", "hihi"],
    avatar: '/img/icon.png',
    isGroup: false
  }]
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
    

  },
  extraReducers: (builder) => {
    // Обработка состояний для регистрации и авторизации
    builder
      .addMatcher(
        messageApi.endpoints.GetChats.matchPending,
        (state, action) => {
          //state.chat.push(action.payload)
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
  
} = chatSlice.actions;

export default chatSlice.reducer;
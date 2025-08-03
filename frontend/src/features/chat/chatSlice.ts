// features/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { messageApi } from "./api/chatApi";
import { Message } from "../../types/Message";

export interface chat {
    id: number;
    username: string;
    name?:string;
    type: string;
    chat_id?: string;
    lastmessage: string;
    created_at: string;
    updated_at: string;
    avatar_url: string;
    users: string[];
    owner: number;
}

interface chatState {
    chat?: chat[];
    activeHistory?: Message[];
    activeChat?: chat | undefined;
    openMessage?: Message;
    uploadstate?: boolean;
    uploadedFiles?: {
        type: string;
        url: string;
    }
}

const initialState: chatState = {};

const chatSlice = createSlice({
    name: "chat",
    initialState,
    reducers: {
        // Авторизация

        // loginSuccess(state, action: PayloadAction<UserData>) {
        //   state.user = action.payload;
        //   state.isAuthenticated = true;
        //   state.loading = false;
        //   console.log(action.payload)
        // },
        setActiveChat(state, action: PayloadAction<chat | undefined>) {
            state.activeChat = action.payload;
        },
        sendMessageVisual(state, action: PayloadAction<any>) {
            if (!state.activeHistory) return
            state.activeHistory.push(action.payload)
        },
        setOpenMessage(state, action: PayloadAction<Message | undefined>) {
            state.openMessage = action.payload
        },
        setUploadState(state, action: PayloadAction<boolean>) {
            state.uploadstate = action.payload
        }
    },
    extraReducers: (builder) => {
        // Обработка состояний для регистрации и авторизации
        builder
            
            .addMatcher(
                messageApi.endpoints.GetMessages.matchFulfilled,
                (state, action) => {
                    state.activeHistory = action.payload;
                },
            )
            .addMatcher(
                messageApi.endpoints.CreateMessages.matchFulfilled,
                (state, action) => {},
            );
    },
});

export const { setActiveChat, sendMessageVisual, setOpenMessage, setUploadState } = chatSlice.actions;

export default chatSlice.reducer;

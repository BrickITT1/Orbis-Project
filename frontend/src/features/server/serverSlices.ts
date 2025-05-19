// features/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { serverApi } from "../../services/server";
import { chat } from "../chat/chatSlices";
import { fastUserInfo } from "../../types/User";

export interface voice {
    id: number;
    name: string;
}

export interface server {
    id: number;
    name: string;
    voices: voice[];
    chats: chat[];
    users: fastUserInfo[];
}

interface serverState {
    servers?: server[];
    activeserver?: server | undefined;
    isActive?: boolean;
    isCreatingServer?: boolean;
}

const initialState: serverState = {
    isCreatingServer: false,
};

const serverSlice = createSlice({
    name: "server",
    initialState,
    reducers: {
        // Авторизация

        // loginSuccess(state, action: PayloadAction<UserData>) {
        //   state.user = action.payload;
        //   state.isAuthenticated = true;
        //   state.loading = false;
        //   console.log(action.payload)
        // },
        setActiveServer(state, action: PayloadAction<server | undefined>) {
            state.activeserver = action.payload;
        },
        setServers(state, action: PayloadAction<server[]>) {
            state.servers = action.payload;
        },
        initCreateServer(state) {
            state.isCreatingServer = true; 
        },
        finallyCreateServer(state) {
            state.isCreatingServer = false; 
        }

    },
    extraReducers: (builder) => {
        // Обработка состояний для регистрации и авторизации
        builder.addMatcher(
            serverApi.endpoints.GetServers.matchFulfilled,
            (state, action) => {
                state.servers = action.payload;
            },
        )
        .addMatcher(
                serverApi.endpoints.GetServersMembers.matchFulfilled,
                (state, action) => {
                    if (!state.activeserver) return;
                    state.activeserver = {
                        ...state.activeserver,
                        users: action.payload,
                    };
                }
            );
        //   .addMatcher(
        //     messageApi.endpoints.GetMessages.matchPending,
        //     (state) => {
        //     }
        //   )
        //   .addMatcher(
        //     messageApi.endpoints.CreateChat.matchPending,
        //     (state) => {
        //     }
        //   )
        //   .addMatcher(
        //     messageApi.endpoints.CreateMessages.matchFulfilled,
        //     (state, action) => {
        //     }
        //   )
    },
});

export const { setActiveServer, setServers, initCreateServer, finallyCreateServer } = serverSlice.actions;

export default serverSlice.reducer;

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
    messegerChange?: boolean;
    userChange?: boolean;
}

const initialState: serverState = {
    isCreatingServer: false,
};

const serverSlice = createSlice({
    name: "server",
    initialState,
    reducers: {
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
        },
        needChange(state) {
            state.messegerChange = true;
        },
        clearChange(state) {
            state.messegerChange = undefined;
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
            )
        .addMatcher(
            serverApi.endpoints.GetServersInside.matchFulfilled,
            (state, action) => {
                    if (!state.activeserver) return;
                    state.activeserver = {
                        ...state.activeserver,
                        ...action.payload,
                    };
                }
        )
    },
});

export const { setActiveServer, setServers, initCreateServer, finallyCreateServer, needChange, clearChange } = serverSlice.actions;

export default serverSlice.reducer;

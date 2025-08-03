// features/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { serverApi } from "./api/serverApi";
import { server, serverState } from "./types/server.types";


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

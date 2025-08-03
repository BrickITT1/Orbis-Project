import { configureStore } from "@reduxjs/toolkit";
import { messageApi } from "../features/chat/api/chatApi";
import authReducer from "../features/auth/authSlice";
import messageReducer from "../features/chat/chatSlice";
import voiceReducer from "../features/voice/voiceSlices";
import serverReducer from "../features/server/serverSlices";
import userReducer from "../features/user/userSlices";
import uploadReducer from '../features/upload/uploadSlice';
import actionReducer from '../features/action/actionSlice';
import  userSettingsReducer from "../features/usersettings/userSettingsSlice";
import { serverApi } from "../features/server/api/serverApi";
import { voiceApi } from "../features/voice/api/voiceApi";
import { authApi } from "@/features/auth";
import { userApi } from "@/features/user";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: messageReducer,
        voice: voiceReducer,
        server: serverReducer,
        user: userReducer,
        upload: uploadReducer,
        action: actionReducer,
        usersettings: userSettingsReducer,
        [authApi.reducerPath]: authApi.reducer,
        [messageApi.reducerPath]: messageApi.reducer,
        [serverApi.reducerPath]: serverApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
        [voiceApi.reducerPath]: voiceApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ["voice/setStreams"], // Игнорируем действия, связанные с `setStreams`
                ignoredPaths: ["voice.audioStreams", "voice.videoStreams"], // Игнорируем конкретные пути состояния
            },
        }).concat(
            authApi.middleware,
            messageApi.middleware,
            serverApi.middleware,
            userApi.middleware,
            voiceApi.middleware
        ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

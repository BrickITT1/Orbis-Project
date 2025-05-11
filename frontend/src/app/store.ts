import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../services/auth";
import { messageApi } from "../services/chat";
import authReducer from "../features/auth/authSlices";
import messageReducer from "../features/chat/chatSlices";
import voiceReducer from "../features/voice/voiceSlices";
import serverReducer from "../features/server/serverSlices";
import userReducer from "../features/user/userSlices";
import { serverApi } from "../services/server";
import { userApi } from "../services/user";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: messageReducer,
        voice: voiceReducer,
        server: serverReducer,
        user: userReducer,
        [authApi.reducerPath]: authApi.reducer,
        [messageApi.reducerPath]: messageApi.reducer,
        [serverApi.reducerPath]: serverApi.reducer,
        [userApi.reducerPath]: userApi.reducer,
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
            userApi.middleware
        ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

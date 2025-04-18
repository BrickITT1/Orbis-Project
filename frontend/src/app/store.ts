import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "../services/auth";
import { messageApi } from "../services/chat";
import authReducer from "../features/auth/authSlices";
import messageReducer from "../features/chat/chatSlices";
import voiceReducer from "../features/voice/voiceSlices";
import serverReducer from "../features/server/serverSlices";
import { serverApi } from "../services/server";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: messageReducer,
        voice: voiceReducer,
        server: serverReducer,
        [userApi.reducerPath]: userApi.reducer,
        [messageApi.reducerPath]: messageApi.reducer,
        [serverApi.reducerPath]: serverApi.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(userApi.middleware, messageApi.middleware, serverApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

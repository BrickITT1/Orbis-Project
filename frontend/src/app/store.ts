import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "../services/auth";
import { messageApi } from "../services/chat";
import authReducer from "../features/auth/authSlices";
import messageReducer from "../features/chat/chatSlices";
import voiceReducer from "../features/voice/voiceSlices";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        chat: messageReducer,
        voice: voiceReducer,
        [userApi.reducerPath]: userApi.reducer,
        [messageApi.reducerPath]: messageApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(userApi.middleware, messageApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

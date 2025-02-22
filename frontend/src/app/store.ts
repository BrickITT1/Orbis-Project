import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "../services/auth";
import authReducer from "../features/auth/authSlices";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [userApi.reducerPath]: userApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(userApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

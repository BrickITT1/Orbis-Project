// features/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AuthState, UserData } from "./types/user";
import { authApi } from "./api/authApi";


const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Авторизация
        loginStart(state, action: PayloadAction<{ email: string; password: string }>) {
            state.loading = true;
            state.error = null;
        },
        loginSuccess(state, action: PayloadAction<UserData>) {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.loading = false;
        },
        loginFailure(state, action: PayloadAction<string>) {
            state.error = action.payload;
            state.loading = false;
        },

        // Регистрация
        registerStart(state, action: PayloadAction<{
                email: string;
                password: string;
                displayName: string;
                username: string;
                birthDate: string;
                policyAgreed: boolean;
            }>,
        ) {
            state.loading = true;
            state.error = null;
        },
        registerSuccess(state, action: PayloadAction<UserData>) {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.loading = false;
        },
        registerFailure(state, action: PayloadAction<string>) {
            state.error = action.payload;
            state.loading = false;
        },

        logout(state) {
            state.user = null;
            state.isAuthenticated = false;
        },
    },
    extraReducers: (builder) => {
        // Обработка состояний для регистрации и авторизации
        builder
            .addMatcher(
                authApi.endpoints.registerUser.matchPending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                authApi.endpoints.registerUser.matchRejected,
                (state, action) => {
                    state.error = action.error.message || 'Ошибка регистрации';
                    state.loading = false;
                }
            )
            .addMatcher(
                authApi.endpoints.loginUser.matchPending,
                (state) => {
                    state.loading = true;
                    state.error = null;
                }
            )
            .addMatcher(
                authApi.endpoints.loginUser.matchFulfilled,
                (state, action) => {
                    state.user = action.payload;
                    state.isAuthenticated = true;
                    state.loading = false;
                }
            )
            .addMatcher(
                authApi.endpoints.loginUser.matchRejected,
                (state, action) => {
                    state.error = action.error.message || 'Ошибка авторизации';
                    state.loading = false;
                }
            )
            .addMatcher(
                authApi.endpoints.logoutUser.matchFulfilled,
                (state) => {
                    state.user = null;
                    state.isAuthenticated = false;
                    state.loading = false;
                }
            )
            .addMatcher(
                authApi.endpoints.refreshToken.matchFulfilled,
                (state, action) => {
                    state.user = action.payload;
                    state.isAuthenticated = true;
                    state.loading = false;
                }
            )
      
    },
});

export const {
    loginStart,
    loginSuccess,
    loginFailure,
    registerStart,
    registerSuccess,
    registerFailure,
    logout,
} = authSlice.actions;

export default authSlice.reducer;

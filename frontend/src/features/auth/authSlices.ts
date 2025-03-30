// features/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { userApi } from '../../services/auth';
import { messageApi } from '../../services/chat';

interface UserData {
  email: string;
  displayName: string;
  username: string;
  birthDate: string;
  access_token: string;
}

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

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
    }>) {
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
        userApi.endpoints.registerUser.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        userApi.endpoints.registerUser.matchFulfilled,
        (state, action) => {
          
          state.user = action.payload;
          state.isAuthenticated = true;
          state.loading = false;
        }
      )
      .addMatcher(
        userApi.endpoints.registerUser.matchRejected,
        (state, action) => {
          state.error = action.error.message || 'Ошибка регистрации';
          state.loading = false;
        }
      )
      .addMatcher(
        userApi.endpoints.loginUser.matchPending,
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        userApi.endpoints.loginUser.matchFulfilled,
        (state, action) => {
          state.user = action.payload;
          state.isAuthenticated = true;
          state.loading = false;
        }
      )
      .addMatcher(
        userApi.endpoints.loginUser.matchRejected,
        (state, action) => {
          state.error = action.error.message || 'Ошибка авторизации';
          state.loading = false;
        }
      )
      .addMatcher(
        userApi.endpoints.logoutUser.matchFulfilled,
        (state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.loading = false;
        }
      )
      .addMatcher(
        userApi.endpoints.refreshToken.matchFulfilled,
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
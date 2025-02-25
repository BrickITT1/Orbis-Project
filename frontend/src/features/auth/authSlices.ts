import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { RegisterForm } from "../../services/types";

interface authState {
    isAuthentification: boolean;
    user?: RegisterForm;
}

const initialState: authState = {
    isAuthentification: false,
};

const authSlice = createSlice({
    name: "Auth",
    initialState,
    reducers: {
        registerStart(state, action: PayloadAction<RegisterForm>) {
            state.user = action.payload;
        },
        registerConfirm(state, action: PayloadAction<RegisterForm>) {
            state.isAuthentification = true;
            state.user = undefined;
        },
        loginSuccess(state, action: PayloadAction<RegisterForm>) {
            state.isAuthentification = true;
            state.user = action.payload;
        },
        logout(state) {
            state.isAuthentification = false;
            delete state.user;
        },
        setUser(state, action: PayloadAction<RegisterForm>) {
            state.user = action.payload;
        },
    },
});

export const { loginSuccess, logout, setUser, registerStart } = authSlice.actions;

export default authSlice.reducer;

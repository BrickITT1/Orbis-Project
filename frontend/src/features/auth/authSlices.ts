import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { RegisterForm } from "../../services/types";

interface authState {
    isAuthentification: boolean;
    user?: RegisterForm;
}

const initialState: authState = {
    isAuthentification: false,
    user: {
            email: {email: "", error: {
                blocked: "",
                format: "",
                require: ''
            }},
            username: {username: "", error: {
                format: "",
                blocked: "",
                require: ""
            }},
            name: {name: "", error: {
                format: "",
                blocked: "",
                require: ""
            }},
            password: {password: "", error: {
                format: "",
                blocked: "",
                require: ""
            }},
            age: {
                age: {
                    day: undefined,
                    month: undefined,
                    year: undefined,
                },
                error: {
                    format: "",
                    blocked: "",
                    require: ""
                }
            },
            confirmPolitical: {confirmPolitical: false, error: {
                format: "",
                blocked: "",
                require: ""
            }}
        }
};

const authSlice = createSlice({
    name: "Auth",
    initialState,
    reducers: {
        registerStart(state, action: PayloadAction<RegisterForm>) {
            state.user = action.payload;
        },
        registerConfirm(state, action: PayloadAction<RegisterForm>) {
            state.isAuthentification = false;
            state.user = initialState.user;
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

export const { loginSuccess, logout, setUser, registerStart, registerConfirm } = authSlice.actions;

export default authSlice.reducer;

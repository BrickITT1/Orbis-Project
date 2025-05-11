// features/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { userApi } from "../../services/user";
import { UserInfo } from "../../types/User";


interface userState {
    loadedProfiles?: UserInfo[];
    openProfile?: UserInfo;
    isOpenProfile?: boolean;
}

const initialState: userState = {
    loadedProfiles: undefined,
    openProfile: {
        id: 0,
        name: "aaaaaa",
        avatar_url: "/img/icon.png",
        about: `
        Lorem, ipsum dolor sit amet consectetur adipisicing elit. 
        Tempora ex error maxime quae aliquam temporibus modi repudiandae eligendi rerum voluptatibus et, 
        voluptates, velit totam dicta animi alias quibusdam dolorem! Dolorum!Lorem, ipsum dolor sit amet 
        consectetur adipisicing elit. Tempora ex error maxime quae aliquam temporibus modi repudiandae eligendi rerum 
        voluptatibus et, voluptates, velit totam dicta animi alias quibusdam dolorem! Dolorum!Lorem, ipsum dolor sit amet 
        consectetur adipisicing elit. Tempora ex error maxime quae aliquam temporibus modi repudiandae eligendi rerum 
        voluptatibus et, voluptates, velit totam dicta animi alias quibusdam dolorem! Dolorum!
        `,
        gender: "male",
    },
    isOpenProfile: false
};

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setProfile(state, action: PayloadAction<UserInfo[]>) {
            state.loadedProfiles = action.payload;
        },
        closeProfile(state) {
            state.isOpenProfile = false;
            state.openProfile = undefined;
        }
    },
    extraReducers: (builder) => {
        // Обработка состояний для регистрации и авторизации
        builder
            .addMatcher(
                userApi.endpoints.getInfoUser.matchFulfilled,
                (state, action) => {
                    state.isOpenProfile = true;
                    state.openProfile = action.payload[0];
                    state.loadedProfiles?.push(action.payload[0]);
                },
            )
    },
});

export const { setProfile, closeProfile } = userSlice.actions;

export default userSlice.reducer;

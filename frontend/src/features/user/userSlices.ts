// features/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { ModeKeys, UserInfo, userState } from "./types/user";
import { userApi } from "./api/userApi";



const initialState: userState = {
    loadedProfiles: undefined,
    openProfile: {
        id: 0,
       username: "aaaaaa",
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
    },
    isOpenProfile: false,
    friendsMode: 'All'
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
        },
        startSearch(state) {
            state.isSearchActive = true;
        },
        endSearch(state) {
            state.isSearchActive = false;
        },
        setFriendMode(state, action: PayloadAction<ModeKeys>) {
            state.friendsMode = action.payload
        }
    },
    extraReducers: (builder) => {
        // Обработка состояний для регистрации и авторизации
        builder
            .addMatcher(
                userApi.endpoints.getInfoUser.matchFulfilled,
                (state, action) => {
                    state.isOpenProfile = true;
                    state.openProfile = action.payload;
                    state.loadedProfiles?.push(action.payload);
                },
            )
            .addMatcher(
                userApi.endpoints.GetChatsUsers.matchFulfilled,
                (state, action) => {
                    state.chats = action.payload
                }
            )
            .addMatcher(
                userApi.endpoints.getFriend.matchFulfilled,
                (state, action) => {
                    
                    state.friends = action.payload;
                }
            )
            .addMatcher(
                userApi.endpoints.getInviteI.matchFulfilled,
                (state, action) => {
                    
                    state.friends = action.payload;
                }
            )
            .addMatcher(
                userApi.endpoints.getInviteMe.matchFulfilled,
                (state, action) => {
                    
                    state.friends = action.payload;
                }
            )
    },
});

export const { setFriendMode, setProfile, closeProfile, startSearch, endSearch } = userSlice.actions;

export default userSlice.reducer;

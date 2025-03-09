import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

const selectAuthState = (state: RootState) => state.auth;

export const selectUser = createSelector(
    [selectAuthState],
    (auth) => auth.user,
);

export const selectAuth = createSelector(
    [selectAuthState],
    (auth) => auth.isAuthenticated,
);

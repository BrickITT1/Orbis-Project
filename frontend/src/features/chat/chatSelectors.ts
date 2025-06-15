
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export const makeSelectIsMessageOpen = (messageId: string) =>
  createSelector(
    (state: RootState) => state.chat.openMessage,
    (openMessage) => String(openMessage?.id) === messageId
  );

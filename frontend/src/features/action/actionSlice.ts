import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { action, actionSlicis } from "./types/visible";


const initialState: actionSlicis = {
    Action: [],
    isPersonalCommunicateActive: true,
};

const actionSlice = createSlice({
    name: 'action',
    initialState,
    reducers: {
        addAction(state, action: PayloadAction<action>) {
            state.Action.push(action.payload)
        },
        removeAction(state, action: PayloadAction<number>) {
            state.Action = state.Action.filter(val => val.id !== action.payload);
        },
        setActivePersonalCommunicate(state, action: PayloadAction<boolean>) {
            state.isPersonalCommunicateActive = action.payload;
        },
    }
});

export const {
    addAction,
    removeAction,
    setActivePersonalCommunicate
} = actionSlice.actions;

export default actionSlice.reducer;

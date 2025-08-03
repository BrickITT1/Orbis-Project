import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "@/config";

export const voiceApi = createApi({
    reducerPath: "voiceApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${config.mediaServiceUrl}/api`,
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const state = getState() as {
                auth: { user: { access_token?: string } };
            }; // Type assertion for state
            const token = state.auth.user?.access_token;

            if (token) {
                headers.set("authorization", `Bearer ${token}`);
            }
            return headers;
        },
    }),
    endpoints: (builder) => ({
        joinRoom: builder.mutation({
            query: ({id, data}) => ({
                url: `/rooms/${id}/join`,
                method: "POST",
                body: data
            }),
        }),
        leaveRoom:builder.mutation({
            query: ({id, data}) => ({
                url: `/rooms/${id}/leave`,
                method: "POST",
                body: data
            }),
        }),
        getPeersInRoom: builder.query({
            query: (id) => ({
                url: `/rooms/${id}/peers`,
                method: "GET",
            }),
        }),
    }),
});

export const {
    useLazyGetPeersInRoomQuery,
    useJoinRoomMutation,
    useLeaveRoomMutation,
} = voiceApi;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "@/config";

export const userApi = createApi({
    reducerPath: "userApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${config.userServiceUrl}/api`,
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
        GetChatsUsers: builder.query({
            query: () => ({
                url: `/chats`,
                method: "GET",
            }),
        }),
        CreateChatUsers: builder.mutation({
            query: (data) => ({
                url: `/chats`,
                method: "POST",
                body: data,
            }),
        }),
        getFriend: builder.query({
            query: () => ({
                url: `/friend`,
                method: "GET",
            }),
        }),
        getInviteMe:builder.query({
            query: () => ({
                url: `/friend/invme`,
                method: "GET",
            }),
        }),
        getInviteI: builder.query({
            query: () => ({
                url: `/friend/invi`,
                method: "GET",
            }),
        }),
        addFriend: builder.mutation({
            query: (id) => ({
                url: `/friend/${id}/invite`,
                method: "POST",
            }),
        }),
        confirmFriend: builder.mutation({
            query: (id) => ({
                url: `/friend/${id}/confirm`,
                method: "POST",
            }),
        }),
        rejectFriend: builder.mutation({
            query: (id) => ({
                url: `/friend/${id}/reject`,
                method: "POST",
            }),
        }),
        getFastInfoUserFromServer: builder.query({
            query: (id) => ({
                url: `/userserver/${id}/`,
                method: "GET",
            }),
        }),
        getInfoUser: builder.query({
            query: (id) => ({
                url: `/user/${id}/`,
                method: "GET",
            }),
        }),
        startChatting: builder.mutation({
            query: (id) => ({
                url: `/user/${id}/chatstart`,
                method: "POST",
            }),
        }),
        getUserbyName: builder.query({
            query: (name) => ({
                url: `/user/search?name=${name}`,
                method: "GET",
            }),
        })
    }),
});

export const {
    useGetChatsUsersQuery,
    useCreateChatUsersMutation,
    useAddFriendMutation,
    useGetFriendQuery,
    useGetFastInfoUserFromServerQuery,
    useGetInfoUserQuery,
    useLazyGetInfoUserQuery,
    useStartChattingMutation,
    useLazyGetUserbyNameQuery,
    useLazyGetFriendQuery,
    useLazyGetInviteIQuery,
    useLazyGetInviteMeQuery,
    useConfirmFriendMutation,
    useRejectFriendMutation,
} = userApi;

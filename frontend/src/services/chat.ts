import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { useAppSelector } from "../app/hooks";

export const messageApi = createApi({
    reducerPath: "messageApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "https://26.234.138.233:4000/api",
        credentials: "include",
        prepareHeaders: (headers, { getState }) => {
            const state = getState() as { auth: { user: { access_token?: string } } }; // Type assertion for state
            const token = state.auth.user?.access_token;

            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }
            return headers;
        }
    }),
    endpoints: (builder) => ({
        GetChats: builder.query({
            query: () => ({
                url: `/chats`,
                method: "GET",
            }),
        }),
        CreateChat: builder.mutation({
            query: (data) => ({
                url: `/chats`,
                method: "POST",
                body: data,
            }),
        }),
        GetMessages: builder.mutation({
            query: (id) => ({
                url: `/chats/${id}/messages`,
                method: "GET",
            }),
        }),
        CreateMessages: builder.mutation({
            query: (id) => ({
                url: `/chats/${id}/messages`,
                method: "GET",
            }),
        }),
    }),
});

export const {
    useGetChatsQuery,
    useCreateChatMutation,
    useCreateMessagesMutation,
    useGetMessagesMutation
} = messageApi;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const messageApi = createApi({
    reducerPath: "messageApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:4000/api",
        credentials: "include",
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

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../../config";

export const messageApi = createApi({
    reducerPath: "messageApi",
    baseQuery: fetchBaseQuery({
        baseUrl: `${config.chatServiceUrl}/api`,
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
        getChatInfo: builder.query({
            query: (id) => ({
                url: `/chat/${id}`,
                method: "GET",
            }),
        }),
        GetMessages: builder.query({
            query: (id) => ({
                url: `/chats/${id}/messages`,
                method: "GET",
            }),
        }),
        CreateMessages: builder.mutation({
            query: ({id, data}) => ({
                url: `/chats/${id}/messages`,
                method: "POST",
                body: data,
            }),
        }),
        RemoveMessage: builder.mutation({
            query: ({chat_id, id}) => ({
                url: `/message/?chat_id=${chat_id}&message_id=${id}`,
                method: "DELETE",

            })
        })
    }),
});

export const {
    
    useCreateMessagesMutation,
    useLazyGetChatInfoQuery,
    useLazyGetMessagesQuery,
    useGetChatInfoQuery,
    useRemoveMessageMutation
} = messageApi;

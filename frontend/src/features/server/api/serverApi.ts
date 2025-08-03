import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../../config";

export const serverApi = createApi({
    reducerPath: "serverApi",
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
        GetServers: builder.query({
            query: () => ({
                url: `/server`,
                method: "GET",
            }),
        }),
        CreateSever: builder.mutation({
            query: (data) => ({
                url: `/server`,
                method: "POST",
                body: data,
            }),
        }),
        GetServersInside: builder.query({
            query: (id) => ({
                url: `/server/${id}/`,
                method: "GET",
            }),
        }),
        CreateChat: builder.mutation({
            query: ({ id, data }) => ({
                url: `/server/${id}/chat`,
                method: "POST",
                body: data,
            }),
        }),
        CreateVoice: builder.mutation({
            query: ({ id, data }) => ({
                url: `/server/${id}/voice`,
                method: "POST",
                body: data,
            }),
        }),
        JoinServer: builder.mutation({
            query: (id) => ({
                url: `/server/${id}/join`,
                method: "POST",
            }),
        }),
        GetServersMembers: builder.query({
            query: (id) => ({
                url: `/server/${id}/members`,
                method: "GET",
            }),
        }),
    }),
});

export const {
    
    useGetServersQuery,
    useLazyGetServersQuery,
    useCreateSeverMutation,
    useGetServersInsideQuery,
    useLazyGetServersInsideQuery,
    useCreateChatMutation,
    useCreateVoiceMutation,
    useJoinServerMutation,
    useLazyGetServersMembersQuery,
} = serverApi;

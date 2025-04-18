import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const serverApi = createApi({
    reducerPath: "serverApi",
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
            query: ({id, data}) => ({
                url: `/server/${id}/chat`,
                method: "POST",
                body: data,
            }),
        }),
        CreateVoice: builder.mutation({
            query: ({id, data}) => ({
                url: `/server/${id}/voice`,
                method: "POST",
                body: data,
            }),
        }),
    }),
});

export const {
    useGetServersQuery,
    useCreateSeverMutation,
    useGetServersInsideQuery,
    useCreateChatMutation,
    useCreateVoiceMutation
} = serverApi;

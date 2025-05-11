import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../config";

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
        getFriend: builder.query({
            query: () => ({
                url: `/user`,
                method: "GET",
            }),
        }),
        addFriend: builder.mutation({
            query: (data) => ({
                url: `/user`,
                method: "POST",
                body: data,
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
    }),
});

export const {
    useAddFriendMutation,
    useGetFriendQuery,
    useGetFastInfoUserFromServerQuery,
    useGetInfoUserQuery,
    useLazyGetInfoUserQuery
} = userApi;

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const userApi = createApi({
    reducerPath: "postsApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:5000/api",
        credentials: "include",
    }),
    endpoints: (builder) => ({
        loginUser: builder.mutation({
            query: (data) => ({
                url: `/login`,
                method: "POST",
                body: data,
            }),
        }),
        checkUser: builder.query({
            query: (name: string) => ({
                url: `/checkname/?name=${name}`,
                method: "GET",
            }),
        }),
        checkEmail: builder.query({
            query: (email: string) => ({
                url: `/checkemail/?email=${email}`,
                method: "GET",
            }),
        }),
        confirmUser: builder.mutation({
            query: (data) => ({
                url: `/confirm`,
                method: "POST",
                body: data,
            }),
        }),
        logoutUser: builder.mutation({
            query: () => ({
                url: `/logout`,
                method: "POST",
            }),
        }),
        registerUser: builder.mutation({
            query: (data) => ({
                url: `/register`,
                method: "POST",
                body: data,
            }),
        }),
        checkAuth: builder.query({
            query: () => ({
                url: `/protected/check`,
                method: "GET",
            }),
        }),
    }),
});

export const {
    useLoginUserMutation,
    useLogoutUserMutation,
    useRegisterUserMutation,
    useCheckAuthQuery,
    useCheckUserQuery,
    useCheckEmailQuery
} = userApi;

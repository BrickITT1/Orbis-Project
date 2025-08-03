import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "@/config";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl: config.authServiceUrl,
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
        refreshToken: builder.mutation({
            query: () => ({
                url: `/refresh`,
                method: "POST",
            }),
        }),
        refreshTokenQuery: builder.query({
            query: () => "/refresh",
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
                body: {},
            }),
        }),
        registerUser: builder.mutation({
            query: (data) => ({
                url: `/register`,
                method: "POST",
                body: data,
            }),
        }),
        sendVerificationCode: builder.mutation<void, string>({
            query: (email) => ({
                url: "/send_code",
                method: "POST",
                body: { email },
            }),
        }),
        verifyCode: builder.mutation<void, { email: string; code: string }>({
            query: (body) => ({
                url: "/verify",
                method: "POST",
                body,
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
    useRefreshTokenMutation,
    useConfirmUserMutation,
    useSendVerificationCodeMutation,
    useVerifyCodeMutation,
    useRefreshTokenQueryQuery,
} = authApi;

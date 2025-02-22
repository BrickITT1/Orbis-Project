import { schema } from "../utils/validation";
import { z } from "zod";

export type User = {
    login: string;
    password: string;
};

export type LoginForm = z.infer<typeof schema>;

export type RegisterForm = {
    email?: string;
    username?: string;
    password?: string;
    phoneNumber?: string;

    name?: string;
    secondName?: string;
    age?: number;
    gender?: string;

    aboutUser?: string;
};

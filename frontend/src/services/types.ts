export type User = {
    login: string;
    password: string;
};

export type LoginForm = {
    email?: string;
    password?: string;
}

export type RegisterForm = {
    email?: string;
    username?: string;
    name?: string;
    password?: string;
    phoneNumber?: string;
    age?: age;
};

export type age = {
    day?: number;
    month?: number;
    year?: number;
}
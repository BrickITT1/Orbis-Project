export type User = {
    login: string;
    password: string;
};

export type LoginForm = {
    email?: string;
    password?: string;
}

export type RegisterForm = {
    email?: {email: string, error: {format: string, blocked: string}};
    username?: {username: string, error: string | null};
    name?: {name: string, error: string | null};
    password?: {password: string, error: {blocked: string, format: string}};
    phoneNumber?: {phoneNumber: string, error: string | null};
    age?: {age: age, error: string | null};
    confirmPolitical?: {confirmPolitical: boolean, error: string | null}
};

export type age = {
    day?: number;
    month?: number;
    year?: number;
}
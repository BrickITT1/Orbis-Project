export type User = {
    login: string;
    password: string;
};

export type LoginForm = {
    email?: string;
    password?: string;
};

export type ErrorType = {
    blocked: string;
    format: string;
    require: string;
};

export type RegisterForm = {
    email?: { email: string; error?: ErrorType | undefined };
    username?: { username: string; error?: ErrorType | undefined };
    name?: { name: string; error?: ErrorType | undefined };
    password?: { password: string; error?: ErrorType | undefined };
    age?: { age: age; error?: ErrorType | undefined };
    confirmPolitical?: {
        confirmPolitical: boolean;
        error?: ErrorType | undefined;
    };
};

export type age = {
    day?: number;
    month?: number;
    year?: number;
};

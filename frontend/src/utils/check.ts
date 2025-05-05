import { LoginForm, RegisterForm } from "../services/types";

export const loginFormChecker = (form: LoginForm) => {
    if (!form.email || !form.password) {
        return false;
    }
};

export const errors = {
    all: ["require"],
    password: ["length", "format"],
    username: ["blocked"],
    email: ["format"],
};

export const validateRegisterData = (registerData: RegisterForm): boolean => {
    if (!registerData.email?.email || registerData.email.error) {
        return false;
    }

    if (!registerData.username?.username || registerData.username.error) {
        return false;
    }

    if (!registerData.name?.name || registerData.name.error) {
        return false;
    }

    if (!registerData.password?.password || registerData.password.error) {
        return false;
    }

    if (
        !registerData.age?.age.day ||
        !registerData.age.age.month ||
        !registerData.age.age.year ||
        registerData.age.error
    ) {
        return false;
    }

    if (!registerData.confirmPolitical?.confirmPolitical) {
        return false;
    }

    return true;
};

export const getDaysInMonth = (year: number, month: number) => {
    // month - это номер месяца от 0 (январь) до 11 (декабрь)
    let dateNumbs = [];
    const countDays = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= countDays; day++) {
        dateNumbs.push(String(day));
    }

    return dateNumbs;
};

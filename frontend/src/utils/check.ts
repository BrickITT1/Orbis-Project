import { LoginForm, RegisterForm } from "../services/types";

export const loginFormChecker = (form: LoginForm) => {
    if (form.email == "" || form.password == "") {
        return ""
    }
}

export const RegisterFormChecker = (form: RegisterForm) => {
    
}


export const getDaysInMonth = (year: number, month: number) => {
    // month - это номер месяца от 0 (январь) до 11 (декабрь)
    let dateNumbs = []; 
    const countDays = new Date(year, month + 1, 0).getDate();
    for (let day = 1; day <= countDays; day++) {
        dateNumbs.push(String(day));
    }

    return dateNumbs
}
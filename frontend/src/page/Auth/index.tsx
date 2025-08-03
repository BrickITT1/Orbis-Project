import React from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm, RegisterForm } from "@/features/auth";

const AuthPageController: React.FC<{ type: string }> = ({ type }) => {
    const navigator = useNavigate();

    return (
        <>
            <div className="fixed top-5 left-5 text-white cursor-pointer p-5" onClick={() => navigator("/")}>
                На главную
            </div>
            <div className="flex justify-center items-center w-screen h-screen ">
                {type === "login" ? <LoginForm /> : null}
                {type === "register" ? <RegisterForm /> : null}
            </div>
        </>
    );
};

export default AuthPageController

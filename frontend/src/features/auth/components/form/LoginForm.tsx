import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useLoginUserMutation } from "../../api/authApi";
import { InputField, SubmitButton } from "./AuthForm";
import { useNavigate } from "react-router-dom";

interface LoginFormData {
    email: string;
    password: string;
}

export const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>();
    const [login, { isLoading, error }] = useLoginUserMutation();

    const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
        try {
            await login(data).unwrap();
        } catch (err) {
            console.error("Login error:", err);
        }
    };

    return (
        <>
            <div className="auth p-20 lg:p-10 bg-[#04122f80] text-white">
                <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="flex flex-col gap-10 ">
                    <h1 className="text-5xl lg:text-2xl text-center">Войти в аккаунт</h1>
                    <InputField<LoginFormData>
                        type="email"
                        placeholder="Почта"
                        name="email"
                        register={register}
                        error={errors.email}
                        validation={{ required: "Required" }}
                    />
                    <InputField<LoginFormData>
                        type="password"
                        placeholder="Пароль"
                        name="password"
                        register={register}
                        error={errors.password}
                        validation={{ required: "Required" }}
                    />
                    <SubmitButton label="Вход" disabled={isLoading} />
                    {error && <div>Error: {(error as any).data?.message}</div>}
                    <span className="relative text-center text-3xl lg:text-base" style={{ textAlign: "center", position: "relative" }}>
                        <a
                            href=""
                            onClick={(e) => {
                                e.preventDefault();
                                navigate("/register");
                            }}
                        >
                            Нет аккаунта
                        </a>
                    </span>
                </form>
            </div>
        </>
    );
};

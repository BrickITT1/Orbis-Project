import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import {
    useSendVerificationCodeMutation,
    useVerifyCodeMutation,
    useRegisterUserMutation,
} from "../../api/authApi";
import { InputField, SubmitButton } from "./AuthForm";
import { useNavigate } from "react-router-dom";

// Типы данных для разных шагов
type Step = "email" | "code" | "register";

interface EmailFormData {
    email: string;
}

interface CodeFormData {
    code: string;
}

interface RegisterFormData {
    display_name: string;
    username: string;
    birth_date: string;
    password: string;
}

export const RegisterForm: React.FC = () => {
    const navigator = useNavigate();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    // RTK Query мутации
    const [sendCode] = useSendVerificationCodeMutation();
    const [verifyCode] = useVerifyCodeMutation();
    const [registerUser, {isSuccess, isError}] = useRegisterUserMutation();

    // Формы для разных шагов
    const emailForm = useForm<EmailFormData>();
    const codeForm = useForm<CodeFormData>();
    const registerForm = useForm<RegisterFormData>();

    console.log(step);
    // Обработчики
    const handleEmailSubmit: SubmitHandler<EmailFormData> = async ({
        email,
    }) => {
        try {
            await sendCode(email).unwrap();
            setEmail(email);
            setStep("code");
        } catch (err) {
            console.error("Error sending code:", err);
        }
    };

    const handleCodeSubmit: SubmitHandler<CodeFormData> = async ({ code }) => {
        if (step == "code") {
            try {
                console.log(code);
                await verifyCode({ email, code }).unwrap();
                setVerificationCode(code);
                setStep("register");
            } catch (err) {
                console.error("Error verifying code:", err);
                navigator("/register");
            }
        }
    };

    const handleRegisterSubmit: SubmitHandler<RegisterFormData> = async (
        data,
    ) => {
        try {
            await registerUser({
                code: verificationCode,
                email,
                ...data,
            }).unwrap();
            
        } catch (err) {
            console.error("Registration error:", err);
            navigator('/login/?confirm=false')
        }
    };

    useEffect(()=>{
        if (isSuccess) {
            navigator('/login/?confirm=true')
        }
    }, [isSuccess])

    return (
        <>
            <div className="auth p-10 bg-[#04122f80] text-white flex flex-col gap-5" >
                {(step == "email" || step == "code") && (
                    <>
                        <form
                            className="auth-code flex flex-col gap-10 "
                            onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
                            autoComplete="off"
                        >
                            <div className="">
                                <h1 className="text-3xl text-center">Инициирование регистрации</h1>
                                
                            </div>
                            <div className="relative">
                            <InputField<EmailFormData>
                                type="email"
                                placeholder="Почта"
                                name="email"
                                readOnly={step == "code"}
                                register={emailForm.register}
                                error={emailForm.formState.errors.email}
                                validation={{ required: "Required" }}
                            />
                            <SubmitButton
                                label="Отправить код"
                                disabled={step == "code"}
                            />
                            </div>
                        </form>
                        <form
                            className="flex flex-col gap-10 "
                            onSubmit={codeForm.handleSubmit(handleCodeSubmit)}
                            autoComplete="off"
                            
                        >
                            <InputField<CodeFormData>
                                readOnly={true}
                                type="text"
                                placeholder="Код подтверждения"
                                name="code"
                                register={codeForm.register}
                                error={codeForm.formState.errors.code}
                                validation={{ required: "Required" }}
                            />
                            <SubmitButton
                                label="Начать регистрацию"
                                disabled={step !== "code"}
                            />
                        </form>
                        
                    </>
                )}

                {step == "register" && (
                    <form
                        onSubmit={registerForm.handleSubmit(
                            handleRegisterSubmit,
                        )}
                        autoComplete="off"
                        className="flex flex-col gap-10 "
                    >
                        <h1 className="text-3xl text-center">Регистрация</h1>
                        <InputField<RegisterFormData>
                            type="password"
                            placeholder="Пароль"
                            name="password"
                            register={registerForm.register}
                            error={registerForm.formState.errors.password}
                            validation={{ required: "Required", minLength: 6 }}
                        />
                        <InputField<RegisterFormData>
                            type="text"
                            placeholder="Отображаемое имя"
                            name="display_name"
                            register={registerForm.register}
                            error={registerForm.formState.errors.display_name}
                            validation={{ required: "Required" }}
                        />
                        <InputField<RegisterFormData>
                            type="text"
                            placeholder="Имя пользователя"
                            name="username"
                            register={registerForm.register}
                            error={registerForm.formState.errors.username}
                            validation={{ required: "Required" }}
                        />
                        <InputField<RegisterFormData>
                            type="date"
                            placeholder="Birth Date"
                            name="birth_date"
                            register={registerForm.register}
                            error={registerForm.formState.errors.birth_date}
                            validation={{ required: "Required" }}
                        />
                        <SubmitButton label="Зарегистрироваться" />
                    </form>
                )}
                <span className="text-center relative text-3xl" style={{ textAlign: "center", position: "relative" }}>
                    <a
                        href=""
                        onClick={(e) => {
                            e.preventDefault();
                            navigator("/login");
                        }}
                    >
                        Назад
                    </a>
                </span>
            </div>
        </>
    );
};

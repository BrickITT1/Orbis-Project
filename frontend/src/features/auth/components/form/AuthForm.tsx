import React from "react";
import {
    UseFormRegister,
    FieldError,
    FieldValues,
    RegisterOptions,
    Path,
} from "react-hook-form";

// Универсальное поле ввода
interface InputFieldProps<T extends FieldValues> {
    type: string;
    placeholder: string;
    name: Path<T>; // Убедитесь, что name соответствует Path<T>
    readOnly?: boolean;
    register: UseFormRegister<T>;
    error?: FieldError;
    validation?: RegisterOptions<T>; // Уберите второй параметр
}

export const InputField = <T extends FieldValues>({
    type,
    placeholder,
    name,
    register,
    error,
    validation,
}: InputFieldProps<T>) => (
    <div className="w-2xl lg:w-[400px]">
        <input
            type={type}
            placeholder={placeholder}
            className="text-3xl w-full lg:text-base box-border p-4 outline-none border-b-2"
            {...register(name, validation)}
        />
        {error && <div>{error.message}</div>}
    </div>
);

// Кнопка отправки
interface SubmitButtonProps {
    label: string;
    disabled?: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
    label,
    disabled,
}) => (
    <button type="submit" disabled={disabled} className="text-3xl lg:text-base">
        {label}
    </button>
);

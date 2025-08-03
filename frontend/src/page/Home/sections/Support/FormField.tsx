import React from "react";
import {
    UseFormRegister,
    FieldError,
    FieldValues,
    RegisterOptions,
    Path,
} from "react-hook-form";

interface InputFieldProps<T extends FieldValues> {
    type: string;
    placeholder: string;
    name: Path<T>; // Убедитесь, что name соответствует Path<T>
    label?: string;
    readOnly?: boolean;
    register: UseFormRegister<T>;
    error?: FieldError;
    validation?: RegisterOptions<T>; // Уберите второй параметр
}

export const InputField = <T extends FieldValues>({
    type,
    placeholder,
    name,
    label,
    register,
    error,
    validation,
}: InputFieldProps<T>) => (
    <div className="flex flex-col gap-2 w-full">
        {label ? <label className="flex text-2xl">{label}</label> : null}
        <div className="border-b-2">
            <input
                type={type}
                placeholder={placeholder}
                className="w-full box-border outline-none text-3xl p-2"
                {...register(name, validation)}
            />
        </div>
        {error && <div>{error.message}</div>}
    </div>
);

interface SubmitButtonProps {
    label: string;
    disabled?: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
    label,
    disabled,
}) => (
    <button type="submit" disabled={disabled} className="text-2xl cursor-pointer border-b-2 p-2 px-10 w-fit">
        {label}
    </button>
);

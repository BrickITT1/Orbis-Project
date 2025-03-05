import React from 'react';
import { UseFormRegister, FieldError, FieldValues, RegisterOptions, Path } from 'react-hook-form';

// Универсальное поле ввода
interface InputFieldProps<T extends FieldValues> {
  type: string;
  placeholder: string;
  name: Path<T>; // Убедитесь, что name соответствует Path<T>
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
  <div>
    <input
      type={type}
      placeholder={placeholder}
      {...register(name, validation)}
    />
    {error && <span>{error.message}</span>}
  </div>
);

// Кнопка отправки
interface SubmitButtonProps {
  label: string;
  disabled?: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({ label, disabled }) => (
  <button type="submit" disabled={disabled}>
    {label}
  </button>
);

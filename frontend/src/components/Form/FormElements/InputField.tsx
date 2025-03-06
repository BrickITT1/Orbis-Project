import React from 'react';
import {
  UseFormRegister,
  FieldError,
  Merge,
  FieldErrorsImpl,
  RegisterOptions
} from 'react-hook-form';

interface InputFieldProps {
  type: string;
  placeholder: string;
  name: string;
  register: UseFormRegister<any>;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
  validation?: RegisterOptions;
  readOnly?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  readOnly,
  type,
  placeholder,
  name,
  register,
  error,
  validation,
  
}) => (
  <div>
    <input
      type={type}
      placeholder={placeholder}
      readOnly={readOnly}
      {...register(name, validation)}
      
    />
    {error && typeof error === 'object' && 'message' in error && (
      <span className='require'>{String(error.message)}</span>
    )}
  </div>
);

export default InputField;
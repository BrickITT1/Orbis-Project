import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useLoginUserMutation } from '../../services/auth';
import { InputField, SubmitButton } from './AuthForm';

interface LoginFormData {
  email: string;
  password: string;
}

export const LoginForm: React.FC = () => {
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
      console.error('Login error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <InputField<LoginFormData>
        type="email"
        placeholder="Email"
        name="email"
        register={register}
        error={errors.email}
        validation={{ required: 'Required' }}
      />
      <InputField<LoginFormData>
        type="password"
        placeholder="Password"
        name="password"
        register={register}
        error={errors.password}
        validation={{ required: 'Required' }}
      />
      <SubmitButton label="Login" disabled={isLoading} />
      {error && <div>Error: {(error as any).data?.message}</div>}
    </form>
  );
};
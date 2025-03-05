// components/AuthForm/AuthForm.tsx
import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import InputField from './FormElements/InputField';
import SubmitButton from './FormElements/SubmitButton';
import CheckboxField from './FormElements/CheckboxField';

interface AuthFormProps {
  onSubmit: SubmitHandler<any>;
  isLogin: boolean;
  loading?: boolean;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSubmit, isLogin, loading }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <InputField
        type="email"
        placeholder="Email"
        name="email"
        register={register}
        error={errors.email}
        validation={{ 
          required: 'Обязательное поле',
          pattern: {
            value: /^\S+@\S+$/i,
            message: 'Некорректный email'
          }
        }}
      />

      <InputField
        type="password"
        placeholder="Пароль"
        name="password"
        register={register}
        error={errors.password}
        validation={{ 
          required: 'Обязательное поле',
          minLength: {
            value: 6,
            message: 'Минимум 6 символов'
          }
        }}
      />
      {!isLogin && (
        <>
          <InputField
            type="text"
            placeholder="Отображаемое имя"
            name="display_name"
            register={register}
            error={errors.display_name}
            validation={{ required: 'Обязательное поле' }}
          />

          <InputField
            type="text"
            placeholder="Логин"
            name="username"
            register={register}
            error={errors.username}
            validation={{ required: 'Обязательное поле' }}
          />

          <InputField
            type="date"
            placeholder="Дата рождения"
            name="birth_date"
            register={register}
            error={errors.birth_date}
            validation={{ required: 'Обязательное поле' }}
          />
          <CheckboxField
            name="policyAgreed"
            label="Я согласен с политикой конфиденциальности"
            register={register}
            error={errors.policyAgreed}
            id="policyAgreed"
          />
        </>
        
      )}

      <SubmitButton 
        label={isLogin ? 'Войти' : 'Зарегистрироваться'} 
        disabled={loading} 
      />
    </form>
  );
};

export default AuthForm;
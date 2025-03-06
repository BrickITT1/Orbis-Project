import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { 
  useSendVerificationCodeMutation,
  useVerifyCodeMutation,
  useRegisterUserMutation
} from '../../services/auth';
import { InputField, SubmitButton } from './AuthForm';
import { useNavigate } from 'react-router-dom';

// Типы данных для разных шагов
type Step = 'email' | 'code' | 'register';

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
  const navigator = useNavigate()
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState(''); // Добавляем состояние для кода
  // RTK Query мутации
  const [sendCode] = useSendVerificationCodeMutation();
  const [verifyCode] = useVerifyCodeMutation();
  const [registerUser] = useRegisterUserMutation();

  
  // Формы для разных шагов
  const emailForm = useForm<EmailFormData>();
  const codeForm = useForm<CodeFormData>();
  const registerForm = useForm<RegisterFormData>();

  console.log(step)
  const handleEmailSubmit: SubmitHandler<EmailFormData> = async ({ email }) => {
    try {
        console.log('Submitting email:', email);
        await sendCode(email).unwrap();
        console.log('Code sent successfully');
        setEmail(email);
        setStep('code');
    } catch (err) {
        console.error('Error sending code:', err);
    }
};

  const handleCodeSubmit: SubmitHandler<CodeFormData> = async ({ code }) => {
    if (step == 'code') {
      try {
        await verifyCode({ email, code }).unwrap();
        setVerificationCode(code); // Сохраняем код
        setStep('register');
      } catch (err) {
        console.error('Error verifying code:', err);
        navigator('/register')
      }
    }
  };

  const handleRegisterSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      await registerUser({code: verificationCode, email, ...data }).unwrap();
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <>
      <div className="form">
      {(step == 'email' || step == 'code') && (
        <>
        <form className='email-form' onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
          <h1>Подтверждение почты</h1>
          <InputField<EmailFormData>
            
            type="email"
            placeholder="Почта"
            name="email"
            readOnly={step == 'code'}
            register={emailForm.register}
            error={emailForm.formState.errors.email}
            validation={{ required: 'Required' }}
            
          />
          <SubmitButton label="Отправить код" disabled={step == 'code'}/>
        </form>
        <form className={step == 'code' ? 'confirm-from' : 'confirm-from confirm-noneactive'} onSubmit={codeForm.handleSubmit(handleCodeSubmit)}>
          <InputField<CodeFormData>
            readOnly={true}
            type="text"
            placeholder="Код подтверждения"
            name="code"
            
            register={codeForm.register}
            error={codeForm.formState.errors.code}
            validation={{ required: 'Required' }}
          />
          <SubmitButton label="Начать регистрацию" disabled={step !== 'code'} />
        </form>
        </>
      )}


      {step == 'register'  && (
        <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}>
          <h1>Регистрация</h1>
          <InputField<RegisterFormData>
            type="password"
            placeholder="Пароль"
            name="password"
            register={registerForm.register}
            error={registerForm.formState.errors.password}
            validation={{ required: 'Required', minLength: 6 }}
          />
          <InputField<RegisterFormData>
            type="text"
            placeholder="Отображаемое имя"
            name="display_name"
            register={registerForm.register}
            error={registerForm.formState.errors.display_name}
            validation={{ required: 'Required' }}
          />
          <InputField<RegisterFormData>
            type="text"
            placeholder="Имя пользователя"
            name="username"
            register={registerForm.register}
            error={registerForm.formState.errors.username}
            validation={{ required: 'Required' }}
          />
          <InputField<RegisterFormData>
            type="date"
            placeholder="Birth Date"
            name="birth_date"
            register={registerForm.register}
            error={registerForm.formState.errors.birth_date}
            validation={{ required: 'Required' }}
          />
          
          <SubmitButton label="Зарегистрироваться" />
        </form>
      )}
      <span><a href="" onClick={(e) => {
                      e.preventDefault();
                      navigator("/login")
                  }}>Назад</a></span>
      </div>
    </>
  );
};
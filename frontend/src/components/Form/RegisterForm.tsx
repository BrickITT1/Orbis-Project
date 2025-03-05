import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { 
  useSendVerificationCodeMutation,
  useVerifyCodeMutation,
  useRegisterUserMutation
} from '../../services/auth';
import { InputField, SubmitButton } from './AuthForm';

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
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  // RTK Query мутации
  const [sendCode] = useSendVerificationCodeMutation();
  const [verifyCode] = useVerifyCodeMutation();
  const [registerUser] = useRegisterUserMutation();

  // Формы для разных шагов
  const emailForm = useForm<EmailFormData>();
  const codeForm = useForm<CodeFormData>();
  const registerForm = useForm<RegisterFormData>();

  // Обработчики
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
    try {
      await verifyCode({ email, code }).unwrap();
      setStep('register');
    } catch (err) {
      console.error('Error verifying code:', err);
    }
  };

  const handleRegisterSubmit: SubmitHandler<RegisterFormData> = async (data) => {
    try {
      await registerUser({ email, ...data }).unwrap();
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <>
      {step === 'email' && (
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
          <InputField<EmailFormData>
            type="email"
            placeholder="Email"
            name="email"
            register={emailForm.register}
            error={emailForm.formState.errors.email}
            validation={{ required: 'Required' }}
          />
          <SubmitButton label="Send Code" />
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={codeForm.handleSubmit(handleCodeSubmit)}>
          <InputField<CodeFormData>
            type="text"
            placeholder="Verification Code"
            name="code"
            register={codeForm.register}
            error={codeForm.formState.errors.code}
            validation={{ required: 'Required' }}
          />
          <SubmitButton label="Verify Code" />
        </form>
      )}

      {step === 'register' && (
        <form onSubmit={registerForm.handleSubmit(handleRegisterSubmit)}>
          <InputField<RegisterFormData>
            type="text"
            placeholder="Display Name"
            name="display_name"
            register={registerForm.register}
            error={registerForm.formState.errors.display_name}
            validation={{ required: 'Required' }}
          />
          <InputField<RegisterFormData>
            type="text"
            placeholder="Username"
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
          <InputField<RegisterFormData>
            type="password"
            placeholder="Password"
            name="password"
            register={registerForm.register}
            error={registerForm.formState.errors.password}
            validation={{ required: 'Required', minLength: 6 }}
          />
          <SubmitButton label="Register" />
        </form>
      )}
    </>
  );
};
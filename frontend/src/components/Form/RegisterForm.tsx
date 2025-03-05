import React from 'react';
import { useRegisterUserMutation } from '../../services/auth';
import AuthForm from './AuthForm';
import { useNavigate } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [register, { isLoading, error }] = useRegisterUserMutation();
  const navigator = useNavigate();

  const handleRegister = async (data: {
    email: string;
    password: string;
    display_name: string;
    username: string;
    birth_date: string;
    policyAgreed: boolean;
  }) => {
    try {
      await register(data).unwrap();
    } catch (err) {
      console.error('Ошибка регистрации:', err);
    }
  };

  return (
    <div>
      <h1>Регистрация</h1>
      
      <AuthForm onSubmit={handleRegister} isLogin={false} loading={isLoading} />
      <span><a href="" onClick={(e) => {
                    e.preventDefault();
                    navigator("/login")
                }}>Уже зарегистрировались?</a></span>
        {error && <div className='require'>{(error as any).data?.message || 'Ошибка регистрации'}</div>}
    </div>
  );
};

export default RegisterPage;
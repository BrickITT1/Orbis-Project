import React from 'react';
import { useLoginUserMutation } from '../../services/auth';
import AuthForm from './AuthForm';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { loginSuccess } from '../../features/auth/authSlices';

const LoginPage: React.FC = () => {
  const [login, { isLoading, error }] = useLoginUserMutation();
  const dispatch = useAppDispatch();
  const navigator = useNavigate();

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      const response = await login(data).unwrap();
      console.log(response)
      //dispatch(loginSuccess())
    } catch (err) {
      console.error('Ошибка авторизации:', err);
    }
  };

  return (
    <div>
      <h1>Авторизация</h1>
      
      <AuthForm onSubmit={handleLogin} isLogin={true} loading={isLoading} />
      {error && <div className='require'>{(error as any).data?.message || 'Ошибка авторизации'}</div>}
      <span><a href="" onClick={(e) => {
                    e.preventDefault();
                    navigator("/register")
                }}>Нет аккаунта</a></span>
    </div>
    
  );
};

export default LoginPage;

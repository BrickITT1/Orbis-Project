import React from 'react';
import "../styles/components/LoginForm.scss"
import { useNavigate } from 'react-router-dom';
import { Main } from '../components/Layouts/Main';
import RegisterPage from '../components/Form/RegisterForm';
import LoginPage from '../components/Form/LoginForm';

export const AuthPageController: React.FC<{type: string}> = ({type}) =>  {
    const navigator = useNavigate();

    return ( 
        <>
        <Main></Main>
        <div className="logib-logo" onClick={()=> navigator('/')}>На главную</div>
        <div className="login-main">
            {
                type === "login" ? 
                <LoginPage /> : null
            }
            {
                type === "register" ?
                <RegisterPage /> : null
            }
        </div>    
        </> 
    );
}
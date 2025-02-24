import React from 'react';
import "../styles/components/LoginForm.scss"
import { Login } from '../components/loginForm/Login';
import { Register } from '../components/loginForm/Register';
import { useNavigate } from 'react-router-dom';
import { ConfirmEmail } from '../components/loginForm/ConfirmEmail';

export const LoginPage: React.FC<{type: string}> = ({type}) =>  {
    const navigator = useNavigate();

    return ( 
        <>
        <div className="logib-logo" onClick={()=> navigator('/')}>На главную</div>
        <div className="login-main">
            {
                type === "login" ? 
                <Login /> : null
            }
            {
                type === "register" ?
                <Register /> : null
            }
            {
                type === "confirmemail" ?
                <ConfirmEmail /> : null
            }
        </div>    
        </> 
    );
}
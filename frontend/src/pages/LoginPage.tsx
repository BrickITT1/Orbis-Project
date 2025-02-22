import React from 'react';
import { Login } from '../components/loginForm/Login';
import { Register } from '../components/loginForm/Register';

import "../styles/components/LoginForm.scss"

export const LoginPage = () =>  {
    return ( 
        <>
            <div className="login-main">
                <Login />
            </div>
        </> 
    );
}
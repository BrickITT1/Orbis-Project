import React, { PureComponent } from 'react';
import { useLoginUserMutation } from '../../services/auth';
import { LoginForm } from '../../services/types';
import { loginSuccess } from '../../features/auth/authSlices';
import { useAppDispatch } from '../../app/hooks';
import { useNavigate } from 'react-router-dom';

export const Login = () =>  {
    const [loginUser] = useLoginUserMutation();
    const dispatch = useAppDispatch();
    const navigator = useNavigate();

    const onLogIn = async (data: LoginForm) => {
        try {
            const response = await loginUser(data).unwrap();
            dispatch(loginSuccess(response?.user));

            // navigator("/");
        } catch (err: any) {
            if (err.data.message) {
                console.error("Registration failed:", err.data.message)
            } else {
                console.error("Registration failed:", err);
            }
        }
    };
    
    return ( 
        <>
            <form action="" method='POST' onSubmit={(e) => e.preventDefault()}>
                <h1>Авторизация</h1>
                <div className="input-container">
                    <label htmlFor="">Адрес электронной почты или номер телефона</label>
                    <div className="">
                        <input type="text" />
                    </div>
                </div>
                <div className="input-container">
                    <label htmlFor="">Пароль</label>
                    <div className="">
                        <input type="password" />
                    </div>
                </div>
                <span><a href="" onClick={(e) => e.preventDefault()}>Забыли пароль</a></span>
                <div className="">
                    <button onClick={() => onLogIn({})}>Вход</button>
                </div>
                <span><a href="" onClick={(e) => {
                    e.preventDefault();
                    navigator("/register")
                }}>Нет аккаунта</a></span>

            </form>
        </> 
    );
}


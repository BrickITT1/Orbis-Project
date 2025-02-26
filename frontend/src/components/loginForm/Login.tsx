import React, { useState } from 'react';
import { useLoginUserMutation } from '../../services/auth';
import { LoginForm } from '../../services/types';
import { loginSuccess } from '../../features/auth/authSlices';
import { useAppDispatch } from '../../app/hooks';
import { useNavigate } from 'react-router-dom';

export const Login = () =>  {
    const [LoginForm, setLoginForm] = useState<LoginForm>(
        {
            email: "",
            password: ""
        }
    )
    const [error, setError] = useState<boolean>(false)
    const [loginUser] = useLoginUserMutation();
    const dispatch = useAppDispatch();
    const navigator = useNavigate();

    // useEffect(() => {
    //         const handleContextMenu = (event: MouseEvent) => {
    //           event.preventDefault();
    //         };
        
    //         document.addEventListener('contextmenu', handleContextMenu);
        
    //         return () => {
    //           document.removeEventListener('contextmenu', handleContextMenu);
    //         };
    //       }, []);

    const onLogIn = async () => {
        try {
            if (LoginForm.email && LoginForm.password) {
                const response = await loginUser(LoginForm).unwrap();
                
                //dispatch(loginSuccess(response?.user));
                navigator("/");
            }
            
        } catch (err: any) {
            setError(true)
        }
    };

    const handlerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLoginForm({ ...LoginForm, [e.target.name]: e.target.value });
    };
    
    return ( 
        <>
            <form action="" method='POST' onSubmit={(e) => e.preventDefault()}>
                <h1>Авторизация</h1>
                <div className="errors-container" style={!error ? { display: "none"} : {}}>
                    Неверное имя пользователя или пароль 
                </div>
                <div className="input-container">
                    <label htmlFor="">Адрес электронной почты <span className='require'>*</span></label>
                    <div className="">
                        <input type="text" name="email" value={LoginForm.email} onChange={(e) => handlerChange(e)} required/>
                        
                    </div>
                </div>
                <div className="input-container">
                    <label htmlFor="">Пароль <span className='require'>*</span></label>
                    <div className="">
                        <input type="password" name="password" value={LoginForm.password} onChange={(e) => handlerChange(e)} required/>
                    </div>
                </div>
                <div className="">
                    <span><a href="" onClick={(e) => e.preventDefault()}>Забыли пароль</a></span>
                    <div className="">
                        <button onClick={() => onLogIn()}>Вход</button>
                    </div>
                </div>
                
                <span><a href="" onClick={(e) => {
                    e.preventDefault();
                    navigator("/register")
                }}>Нет аккаунта</a></span>

            </form>
        </> 
    );
}


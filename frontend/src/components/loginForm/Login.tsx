import React, { PureComponent } from 'react';
import { useLoginUserMutation } from '../../services/auth';
import { LoginForm } from '../../services/types';
import { loginSuccess } from '../../features/auth/authSlices';
import { useAppDispatch } from '../../app/hooks';

export const Login = () =>  {
    const [loginUser] = useLoginUserMutation();
    const dispatch = useAppDispatch();
    // navigator = useNavigate();

    const onSubmit = async (data: LoginForm) => {
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
                <label htmlFor="">Алрес электронной почты или номер телефона</label>
                <div className="">
                    <input type="text" />
                </div>
                
                <label htmlFor="">Пароль</label>
                <div className="">
                    <input type="text" />
                </div>
                <span><a href="">Забыли пароль</a></span>
                <div className="">
                    <button onClick={() => onSubmit({})}>Вход</button>
                </div>
                <span>Нужна учетная запись? <a href="">Зарегистрироваться</a></span>

            </form>
        </> 
    );
}


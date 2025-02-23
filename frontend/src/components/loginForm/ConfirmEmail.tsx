import React, { PureComponent } from 'react';
import { useNavigate } from 'react-router-dom';

export const ConfirmEmail = () =>  {
    const navigator = useNavigate();
      
    return ( 
        <>
            <form action="" method='POST' onSubmit={(e) => e.preventDefault()}>
                <h1>Подтверждение E-mail</h1>
                <label htmlFor="">Вы не робот?</label>
                <div className="">
                    "Капча"
                </div>
                <label htmlFor="">Ваша Почта</label>
                <div className="">
                    <input type="text" disabled/>
                </div>
                <div className="">
                    <button>Отправить код</button>
                </div>
                <label htmlFor="">Введите код</label>
                <div className="email-confirm flex-row">
                    <input type="text" />
                    <input type="text" />
                    <input type="text" />
                    <input type="text" />
                    <input type="text" />
                    <input type="text" />
                    <input type="text" />
                    <input type="text" />
                </div>

                <div className="">
                    <button>Зарегистрироваться</button>
                </div>
                                
                <span><a href="" onClick={(e) => {
                    e.preventDefault();
                    navigator("/register")
                }}>Назад</a></span>

            </form>
        </> 
    );
}


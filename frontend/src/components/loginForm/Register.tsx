import React, { PureComponent } from 'react';

export const Register = () =>  {
    return ( 
        <>
            <form action="" method='POST' onSubmit={(e) => e.preventDefault()}>
                <h1>Создать учётную запись</h1>
                <label htmlFor="">E-mail</label>
                <div className="">
                    <input type="text" />
                </div>
                <div className="input-container">
                    <label htmlFor="">Отображаемое Имя</label>
                    <div className="">
                        <input type="text" />
                    </div>
                </div>
                
                <div className="input-container">
                    <label htmlFor="">Имя пользователя</label>
                    <div className="">
                        <input type="text" />
                    </div>
                </div>

                <div className="input-container">
                    <label htmlFor="">Пароль</label>
                    <div className="">
                        <input type="text" />
                    </div>
                </div>

                <div className="date-container">
                    <div className="label">Дата рождения</div>
                    <div className="">
                        <select name="date" id="" >
                            <option value="">Дата</option>
                        </select>
                        <select name="date" id="" ><option value="">Месяц</option></select>
                        <select name="date" id="" ><option value="">Год</option></select>
                    </div>
                </div>
                <div className="">
                    <input type="checkbox" name="" id="" /> <label htmlFor="">Подтверждаю ознакомление и согласие с <a href="">Условиями пользования</a> и <a href="">Политикой конфидинциальности</a> Orbis</label>
                </div>

                <div className="">
                    <button>Продолжить</button>
                </div>
                <span><a href="">Уже зарегистрировались?</a></span>

            </form>
        </> 
    );
}
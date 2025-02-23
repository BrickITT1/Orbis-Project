import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../../services/types';

interface datebirth {
    day: boolean;
    mounth: boolean;
    year: boolean;
}

interface datesbirth {
    day: number[];
    mounth: number[];
    year: number[];
}

const dateActiveInit: datebirth = {
    day: false,
    mounth: false,
    year: false
}

const dateNumbs: datesbirth = {
    day: [],
    mounth: [],
    year: []
};

// Заполнение массива годов
for (let year = new Date().getFullYear(); year >= 1900; year--) {
    dateNumbs.year.push(year);
}

// Заполнение массива месяцев (от 1 до 12)
for (let month = 1; month <= 12; month++) {
    dateNumbs.mounth.push(month);
}

// Заполнение массива дней (например, для 31 дня)
for (let day = 1; day <= 31; day++) {
    dateNumbs.day.push(day);
}

export const Register = () =>  {
    const navigator = useNavigate();
    const [dateActive, setDateActive] = useState<datebirth>(dateActiveInit)
    const [registerData, setRegisterData] = useState<RegisterForm>({
        email: "",
        username: "",
        name: "",
        password: "",
        phoneNumber: "",
        age: {
            day: undefined,
            month: undefined,
            year: undefined,
        },
    })

    const handleInputFocus = (target: keyof datebirth) => {
        setDateActive(dateActiveInit)
        setDateActive({...dateActive, [target]: true})
    }

    const handleInputBlur = (target: keyof datebirth) => {
        setDateActive(dateActiveInit)
        setDateActive({...dateActive, [target]: false})
    }
    return ( 
        <>
            <form action="" method='POST' onSubmit={(e) => e.preventDefault()}>
                <h1>Создать учётную запись</h1>
                
                <div className="input-container">
                    <label htmlFor="">E-mail</label>
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
                    <div className="flex-row custom-date">
                        <div className="custom-input__select">
                            <input 
                                name="" 
                                id="" 
                                value={registerData.age?.day === undefined ? "Дата" : registerData.age?.day} 
                                onFocus={() => handleInputFocus("day")}
                                onBlur={() => handleInputBlur("day")}
                            />
                            <div className={dateActive.day ? "custom-select" : "custom-select hide"}>
                                {dateNumbs.day.map((val: number)=>(
                                    <div key={val} onClick={()=> {
                                        setRegisterData({...registerData, age: {...registerData.age, day: val}})
                                    }}  className="custom-option">{val}</div>
                                ))}
                            </div>
                        </div>
                        <div className="custom-input__select">
                            <input 
                                name="" 
                                id="" 
                                value={registerData.age?.month === undefined ? "Месяц" : registerData.age?.month} 
                                onFocus={() => handleInputFocus("mounth")}
                                onBlur={() => handleInputBlur("mounth")}
                            />
                            <div className={dateActive.mounth ? "custom-select" : "custom-select hide"}>
                                {dateNumbs.mounth.map((val: number)=>(
                                    <div key={val} onClick={()=> {
                                        setRegisterData({...registerData, age: {...registerData.age, month: val}})
                                    }} className="custom-option">{val}</div>
                                ))}
                            </div>
                        </div>
                        <div className="custom-input__select">
                            <input 
                                name="" 
                                id="" 
                                value={registerData.age?.year === undefined ? "Год" : registerData.age?.year} 
                                onFocus={() => handleInputFocus("year")}
                                onBlur={() => handleInputBlur("year")}
                                />
                            <div className={dateActive.year ? "custom-select" : "custom-select hide"}>
                                {dateNumbs.year.map((val: number)=>(
                                    <div key={val} onClick={()=> {
                                        setRegisterData({...registerData, age: {...registerData.age, year: val}})
                                    }} className="custom-option">{val}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="">
                    <input type="checkbox" name="" id="first-confirm" /> <label htmlFor="first-confirm">Подтверждаю ознакомление и согласие с <a href="">Условиями пользования</a> и <a href="">Политикой конфидинциальности</a> Orbis</label>
                </div>

                <div className="">
                    <button onClick={(e) => {
                        e.preventDefault();
                        navigator("/confirm")
                    }}>Продолжить</button>
                </div>
                <span><a href="" onClick={(e) => {
                    e.preventDefault();
                    navigator("/login")
                }}>Уже зарегистрировались?</a></span>

            </form>
        </> 
    );
}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../../services/types';
import { getDaysInMonth } from '../../utils/check';
import { registerStart } from '../../features/auth/authSlices';
import { useAppDispatch } from '../../app/hooks';

interface datebirth {
    day: boolean;
    mounth: boolean;
    year: boolean;
}

interface datesbirth {
    mounth: number[];
    year: number[];
}

const dateActiveInit: datebirth = {
    day: false,
    mounth: false,
    year: false
}

let dateNumbs: datesbirth = {
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

export const Register = () =>  {
    const navigator = useNavigate();
    const dispatch = useAppDispatch();
    const [dateActive, setDateActive] = useState<datebirth>(dateActiveInit)
    const [registerData, setRegisterData] = useState<RegisterForm>({
        email: {email: "", error: ""},
        username: {username: "", error: ""},
        name: {name: "", error: ""},
        password: {password: "", error: ""},
        phoneNumber: {phoneNumber: "", error: ""},
        age: {
            age: {
                day: undefined,
                month: undefined,
                year: undefined,
            },
            error: ""
        },
        confirmPolitical: {confirmPolitical: false, error: ""}
    })
    const [Days, setDays] = useState<string[]>([]);

    useEffect(() => {
        if (registerData.age && registerData.age.age.month && registerData.age.age.year) {
            const daysInMonth = getDaysInMonth(Number(registerData.age.age.year), Number(registerData.age.age.month) - 1);
            setDays(daysInMonth);
            
            if (registerData.age.age.day && registerData.age.age.day > daysInMonth.length) {
                setRegisterData({ ...registerData, age: {...registerData.age, age: {...registerData.age.age, day: daysInMonth.length }} });
            }
        }
    }, [registerData.age]);

    const handleInputFocus = (target: keyof datebirth) => {
        setDateActive(dateActiveInit)
        setDateActive({...dateActive, [target]: true})
    }

    const handleInputBlur = (target: keyof datebirth) => {
        setDateActive(dateActiveInit)
        setDateActive({...dateActive, [target]: false})
    }

    const handlerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
    
        // Use type assertion to specify that name is a key of RegisterForm
        setRegisterData(prevState => ({
            ...prevState,
            [name]: {
                ...prevState[name as keyof RegisterForm], // Assert name as a key of RegisterForm
                [name]: value,
                error: "" // Optionally reset the error if needed
            }
        }));
    };

    const handlerChangeCheckBox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterData({ ...registerData, [e.target.name]: !registerData.confirmPolitical });
    };

    const handlerChangeAge = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDateActive(dateActiveInit)
        setDateActive({...dateActive, [e.target.name]: true})
        const value = e.target.value.replace(/[a-zA-Zа-яА-ЯёЁ]/g, '');

        if (value[value.length - 1] && !value[value.length - 1].match(/^[0-9]+$/)) {
            setRegisterData({ ...registerData, age: {age: { ...registerData.age?.age, [e.target.name]: 0 }, error: "" }});
            return;
        }

        if (e.target.name == 'year' && Number(value) > new Date().getFullYear()) {
            setRegisterData({ ...registerData, age: {age: { ...registerData.age?.age, [e.target.name]: new Date().getFullYear() }, error: "" }});
            return
        }

        if (e.target.name == 'month' && Number(value) > 12) {
            
            setRegisterData({ ...registerData, age: {age: { ...registerData.age?.age, [e.target.name]: 12 }, error: "" }});
            return
        }

        if (e.target.name == 'day' && Number(value) > Days.length) {
            
            setRegisterData({ ...registerData, age: {age: { ...registerData.age?.age, [e.target.name]: Days.length }, error: "" }});
            return
        }

        setRegisterData({ ...registerData, age: {age: { ...registerData.age?.age, [e.target.name]: value }, error: "" }});
        
        
    };

    const checkData = () => {
        
        dispatch(registerStart(registerData));
        navigator('/confirm')
    }

    return ( 
        <>
            <form action="" method='POST' onSubmit={(e) => e.preventDefault()}>
                <h1>Создать учётную запись</h1>
                <div className="input-container">
                    <label htmlFor="">E-mail <span className='require'>*</span> </label>
                    <input type="text" name='email' onChange={(e) => handlerChange(e)}/>
                </div>
                <div className="input-container">
                    <label htmlFor="">Отображаемое Имя</label>
                    <div className="">
                        <input type="text" name='username' onChange={(e) => handlerChange(e)}/>
                    </div>

                </div>
                
                <div className="input-container">
                    <label htmlFor="">Имя пользователя <span className='require'>*</span></label>
                    <div className="">
                        <input type="text" name='name' onChange={(e) => handlerChange(e)}/>
                    </div>
                    <span className='require'>Это имя занято. Попробуйте добавить цифры, буквы, нижнее подчёркивание</span>
                </div>

                <div className="input-container">
                    <label htmlFor="">Пароль <span className='require'>*</span></label>
                    <div className="">
                        <input type="password" name='password' onChange={(e) => handlerChange(e)}/>
                    </div>
                    <span className='require'>Введите не менее 8 символов</span><br />
                    <span className='require'>Пароль не надёжный</span>
                </div>

                <div className="date-container">
                    <div className="label">Дата рождения <span className='require'>*</span></div>
                    <div className="flex-row custom-date">
                        <div className="custom-input__select">
                            <input 
                                name="year" 
                                id="" 
                                value={registerData.age?.age.year === undefined ? "Год" : registerData.age?.age.year} 
                                onFocus={() => handleInputFocus("year")}
                                onBlur={() => handleInputBlur("year")}
                                onChange={(e) => handlerChangeAge(e)}
                                />
                            <div className={dateActive.year ? "custom-select" : "custom-select hide"}>
                                {dateNumbs.year.map((val: number)=>(
                                    <div key={val} onClick={() => {
                                        setRegisterData(prevState => ({
                                            ...prevState,
                                            age: {
                                                ...prevState.age || { // Provide a default value if age is undefined
                                                    age: {
                                                        day: undefined,
                                                        month: undefined,
                                                        year: undefined,
                                                    },
                                                    error: ""
                                                },
                                                age: {
                                                    ...prevState.age?.age, // Use optional chaining to safely access age
                                                    year: val // Set the year to val
                                                },
                                                error: "" // Optionally reset the error if needed
                                            }
                                        }));
                                    }} className="custom-option">{val}</div>
                                    
                                    
                                ))}
                            </div>
                        </div>
                        <div className="custom-input__select">
                            <input 
                                name="month" 
                                id="" 
                                value={registerData.age?.age.month === undefined ? "Месяц" : registerData.age?.age.month} 
                                onFocus={() => handleInputFocus("mounth")}
                                onBlur={() => handleInputBlur("mounth")}
                                onChange={(e) => handlerChangeAge(e)}
                            />
                            <div className={dateActive.mounth ? "custom-select" : "custom-select hide"}>
                                {dateNumbs.mounth.map((val: number)=>(
                                    <div key={val} onClick={() => {
                                        setRegisterData(prevState => ({
                                            ...prevState,
                                            age: {
                                                ...prevState.age || { // Provide a default value if age is undefined
                                                    age: {
                                                        day: undefined,
                                                        month: undefined,
                                                        year: undefined,
                                                    },
                                                    error: ""
                                                },
                                                age: {
                                                    ...prevState.age?.age, // Use optional chaining to safely access age
                                                    month: val // Set the year to val
                                                },
                                                error: "" // Optionally reset the error if needed
                                            }
                                        }));
                                    }} className="custom-option">{val}</div>
                                ))}
                            </div>
                        </div>
                        <div className="custom-input__select">
                            <input 
                                name="day" 
                                id="" 
                                value={registerData.age?.age.day === undefined ? "Дата" : registerData.age?.age.day} 
                                onFocus={() => handleInputFocus("day")}
                                onBlur={() => handleInputBlur("day")}
                                
                                onChange={(e) => handlerChangeAge(e)}
                                disabled={registerData.age?.age.month && registerData.age.age.year ? false: true}
                            />
                            <div className={dateActive.day ? "custom-select" : "custom-select hide"}>
                                {Days.length > 0 && Days.map((val: string)=>(
                                    <div key={val} onClick={()=> {
                                        setRegisterData(
                                            {...registerData, 
                                                age: {
                                                    age: {...registerData.age?.age, day: Number(val)},
                                                    error: ""
                                                }})
                                    }}  className="custom-option">{val}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="">
                    <input 
                        type="checkbox" 
                        name="confirmPolitical" 
                        id="first-confirm" 
                        checked={registerData.confirmPolitical?.confirmPolitical} 
                        onChange={(e) => handlerChangeCheckBox(e)}
                    /> 
                    <label 
                        htmlFor="first-confirm"
                    >Подтверждаю ознакомление и согласие с <a href="">Условиями пользования</a> и <a href="">Политикой конфидинциальности</a> Orbis
                    </label>
                </div>

                <div className="">
                    <button onClick={(e) => {
                        e.preventDefault();checkData()
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
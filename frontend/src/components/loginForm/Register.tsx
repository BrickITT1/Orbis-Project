import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../../services/types';
import { getDaysInMonth, validateRegisterData } from '../../utils/check';
import { registerStart } from '../../features/auth/authSlices';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useCheckEmailQuery, useCheckUserQuery } from '../../services/auth';

interface datebirth {
    day: boolean;
    mounth: boolean;
    year: boolean;
}

const initialDateState = { day: false, mounth: false, year: false };

type FieldType = 'name' | 'email' | 'password' | 'age';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const passwordRegex = /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])(?=.*[A-Z])(?=.*\d).+$/;

const useDebounce = <T extends unknown>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
  
      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);
  
    return debouncedValue;
};

export const Register = () =>  {
    const navigator = useNavigate();
    const dispatch = useAppDispatch();
    
    const saveData = useAppSelector(state => state.auth.user)
    const [dateActive, setDateActive] = useState<datebirth>(initialDateState)

    const [registerData, setRegisterData] = useState<RegisterForm>(saveData as RegisterForm)
    const [Days, setDays] = useState<string[]>([]);
    const debouncedUsername = useDebounce(registerData.name?.name || '', 300);
    const debouncedEmail = useDebounce(registerData.email?.email || '', 300);
    const debouncedPassword = useDebounce(registerData.password?.password || '', 300);

    const { data: checkUsername, refetch: checkUsernameAPI, isLoading, isError: isErrorName } = useCheckUserQuery(debouncedUsername || "", { skip: !debouncedUsername });
    const { data: checkEmail, refetch: checkEmailAPI , isLoading: isLoadingEmail, isError: isErrorEmail } = useCheckEmailQuery(debouncedEmail || "", { skip: !debouncedEmail });
    
    const dateNumbs = useMemo(() => ({
        mounth: Array.from({ length: 12 }, (_, i) => i + 1),
        year: Array.from({ length: new Date().getFullYear() - 1899 }, (_, i) => new Date().getFullYear() - i)
      }), []);

    const updateError = (field: FieldType, error: { format?: string; blocked?: string, require?: string }) => {
        setRegisterData(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                error: {
                    format: error.format ? error.format : prev[field]?.error?.format,
                    blocked: error.blocked ? error.blocked : prev[field]?.error?.blocked,
                    require: error.require ? error.require : prev[field]?.error?.require
                }
            }
        }));
    };

    const clearFieldError = (field: FieldType) => {
        setRegisterData(prev => ({
            ...prev,
            [field]: {
                ...prev[field],
                error: undefined
            }
        }));
    }
    
    useEffect(() => {
        if (isErrorName) {
            updateError("name", { format: registerData.name?.error?.format || '' , blocked: 'This Name blocked' });
        }
    }, [isErrorName]);

    useEffect(() => {
        if (isErrorEmail) {
            updateError('email', { format: registerData.email?.error?.format || '' , blocked: 'This Email blocked' });
        }
    }, [isErrorEmail]);

    useEffect(() => {
        if (!emailRegex.test(debouncedEmail)) {
          updateError('email', { format: 'uncorrect format', blocked: registerData.email?.error?.blocked || '' });
        }
      }, [debouncedEmail]);
    
    useEffect(() => {
        const errors = {
            format: !passwordRegex.test(debouncedPassword) ? 'un correct format' : '',
            blocked: debouncedPassword.length < 8 ? 'min length 8' : ''
        };

        if (errors.format || errors.blocked) {
            updateError('password', errors);
        }
    }, [debouncedPassword]);

    const daysInMonth = useMemo(() => {
        if (registerData.age?.age?.month && registerData.age?.age?.year) {
          return getDaysInMonth(
            Number(registerData.age.age.year),
            Number(registerData.age.age.month) - 1
          );
        }
        return [];
    }, [registerData.age?.age?.month, registerData.age?.age?.year]);

    useEffect(() => {
        setDays(daysInMonth);
    }, [daysInMonth]);

    // useEffect(() => {
    //     const handleContextMenu = (event: MouseEvent) => {
    //       event.preventDefault();
    //     };
    
    //     document.addEventListener('contextmenu', handleContextMenu);
    
    //     return () => {
    //       document.removeEventListener('contextmenu', handleContextMenu);
    //     };
    //   }, []);

    const handleInputFocus = useCallback((target: keyof datebirth) => {
        setDateActive(initialDateState)
        setDateActive({...dateActive, [target]: true})
    }, [])

    const handleInputBlur = useCallback((target: keyof datebirth) => {
        setDateActive(initialDateState)
        setDateActive({...dateActive, [target]: false})
    }, [])

    const handlerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;   

        setRegisterData(prevState => ({
            ...prevState,
            [name]: {
                ...prevState[name as keyof RegisterForm], // Assert name as a key of RegisterForm
                [name]: value,
                error: null 
            }
        }));
        
    }, []);

    const handlerChangeCheckBox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterData({ ...registerData, 
            confirmPolitical: {
                confirmPolitical: !registerData.confirmPolitical?.confirmPolitical,
                error: undefined
        } });
        
    };

    const handlerChangeAge = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const cleanedValue = value.replace(/[^0-9]/g, ''); // Удаляем все символы, кроме цифр
    
        // Устанавливаем начальное состояние для dateActive
        setDateActive(prev => ({ ...initialDateState, [name]: true }));
    
        // Функция для обновления registerData
        const updateRegisterData = (newValue: number | string, resetDay: boolean = false) => {
            
            setRegisterData(prev => ({
                ...prev,
                age: {
                    age: {
                        ...prev.age?.age, // Убедитесь, что prev.age существует
                        [name]: newValue,
                        ...(resetDay && { day: 1 }), // Сбрасываем день на 1, если resetDay = true
                    },
                }
            }));
            clearFieldError('age');
        };
    
        // Проверка на валидность значения
        if (!cleanedValue || !cleanedValue.match(/^[0-9]+$/)) {
            updateRegisterData(0, true);
            return;
        }
    
        const numericValue = Number(cleanedValue);
        let finalValue = numericValue;
    
        // Проверка на максимальные значения для года, месяца и дня
        if (name === 'year') {
            finalValue = Math.min(numericValue, new Date().getFullYear());
            updateRegisterData(finalValue, true); // Сбрасываем день при изменении года
        } else if (name === 'month') {
            finalValue = Math.min(numericValue, 12);
            updateRegisterData(finalValue, true); // Сбрасываем день при изменении месяца
        } else if (name === 'day') {
            finalValue = Math.min(numericValue, Days.length);
            updateRegisterData(finalValue);
        }
    };

    const checkData = () => {
        if (!registerData.name?.name) {
            updateError('name', { require: 'require'});
        }
        if (!registerData.email?.email) {
            updateError('email', { require: 'require'});
        }
        if (!registerData.password?.password) {
            updateError('password', { require: 'require'});
        }
        if (!registerData.age?.age.day || !registerData.age?.age.month || !registerData.age?.age.year) {
            updateError('age', { require: 'require'});
        }
        console.log(registerData)
        if (validateRegisterData(registerData)) {
            dispatch(registerStart(registerData));
            navigator('/confirm')
        }
    }

    return ( 
        <>
            <form action="" method='POST' onSubmit={(e) => e.preventDefault()}>
                <h1>Создать учётную запись</h1>
                <div className="input-container">
                    <label htmlFor="">E-mail <span className='require'>*</span>
                    {registerData.email?.error?.require === 'require' ? <span className='require require-err'> Обязательно</span> : null}
                    </label>
                    <input type="text" name='email' onChange={(e) => handlerChange(e)} required value={registerData.email?.email}/>
                    <div className="form-error">
                        {registerData.email?.error?.blocked && (debouncedEmail !== "") ? <span className='require'>Это почта используется.</span> : null}
                        {registerData.email?.error?.format && (debouncedEmail !== "") ? <span className='require'>Не правильный формат почты.</span> : null}
                    </div>
                    
                </div>
                <div className="input-container">
                    <label htmlFor="">Отображаемое Имя</label>
                    <div className="">
                        <input type="text" name='username' onChange={(e) => handlerChange(e)} value={registerData.username?.username}/>
                    </div>

                </div>
                
                <div className="input-container">
                    <label htmlFor="">Имя пользователя <span className='require'>*</span>
                        {registerData.name?.error?.require ? <span className='require require-err'> Обязательно</span> : null}
                    </label>
                    <div className="">
                        <input type="text" name='name' onChange={(e) => handlerChange(e)} required value={registerData.name?.name}/>
                    </div>
                    {registerData.name?.error?.blocked ? <span className='require'>Это имя занято. Попробуйте добавить цифры, буквы, нижнее подчёркивание</span> : null}
                </div>

                <div className="input-container">
                    <label htmlFor="">Пароль <span className='require'>*</span>
                    {registerData.password?.error?.require === 'require' ? <span className='require require-err'> Обязательно</span> : null}</label>
                    
                    <div className="">
                        <input type="password" name='password' onChange={(e) => handlerChange(e)} required value={registerData.password?.password}/>
                    </div>
                    {registerData.password?.error?.blocked && (debouncedPassword !== "") ? <><span className='require'>Введите не менее 8 символов</span><br /></>: null}
                    {registerData.password?.error?.format && (debouncedPassword !== "") ? <><span className='require'>Пароль не надёжный, необходимо минимум: <br /> 1 - Цифра,<br />1 - Заглавная буква,<br />1 - Специальный символ</span><br /></>: null}
                </div>

                <div className="date-container">
                    <label >
                        Дата рождения 
                        <span className='require '> *</span>
                        {registerData.age?.error?.require === 'require' ? <span className='require require-err'> Обязательно</span> : null}
                    </label>
                    <div className="flex-row custom-date">
                        <div className="custom-input__select">
                            <input 
                                name="year" 
                                id="" 
                                value={registerData.age?.age.year === undefined ? "Год" : registerData.age?.age.year} 
                                onFocus={() => handleInputFocus("year")}
                                onBlur={() => handleInputBlur("year")}
                                onChange={(e) => handlerChangeAge(e)}
                                required
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
                                                    }
                                                },
                                                age: {
                                                    ...prevState.age?.age, 
                                                    year: val, 
                                                    ...({ day: 1 })
                                                },
                                                error:  { format: '', blocked: '', require: ''}  
                                            }
                                        }));
                                        
                                        clearFieldError('age');
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
                                required
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
                                                    }
                                                },
                                                age: {
                                                    ...prevState.age?.age, // Use optional chaining to safely access age
                                                    month: val, // Set the year to val
                                                    ...({ day: 1 }),
                                                },
                                            },
                                            error:  { format: '', blocked: '', require: ''}  
                                        }));
                                        
                                        clearFieldError('age');
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
                                required
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
                                                },
                                                
                                            })
                                        
                                        clearFieldError('age');

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
                    required
                />

                    <label 
                        htmlFor="first-confirm"
                    >Подтверждаю ознакомление и согласие с <a href="">Условиями пользования</a> и <a href="">Политикой конфидинциальности</a> Orbis
                    </label>
                </div>

                <div className="but">
                    <button type='submit' onClick={(e) => {
                        e.preventDefault();
                        checkData()
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
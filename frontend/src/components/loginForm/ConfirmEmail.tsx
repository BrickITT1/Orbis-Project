import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { registerConfirm } from '../../features/auth/authSlices';
import { useConfirmUserMutation, useRegisterUserMutation } from '../../services/auth';
import Timer from './components/Timer';

export const ConfirmEmail = () => {
    const [isCode, setIsCode] = useState(false)
    const navigator = useNavigate();
    const dispatch = useAppDispatch();
    const registerData = useAppSelector(state => state.auth.user);
    const [code, setCode] = useState(Array(5).fill('')); // Инициализация пустыми строками
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Рефы для input
    const [confirmUser] = useConfirmUserMutation();
    const [registerUser] = useRegisterUserMutation();
    
    // useEffect(() => {
    //         const handleContextMenu = (event: MouseEvent) => {
    //           event.preventDefault();
    //         };
        
    //         document.addEventListener('contextmenu', handleContextMenu);
        
    //         return () => {
    //           document.removeEventListener('contextmenu', handleContextMenu);
    //         };
    //       }, []);

    const handlerChange = (e: React.ChangeEvent<HTMLInputElement>, idx: number) => {
        const { value } = e.target;

        // Проверка, что введенное значение является числом
        if (!value[value.length - 1].match(/^[0-9]+$/)) {
            return;
        }

        // Обновление состояния
        setCode(prevCode => {
            const newCode = [...prevCode];
            newCode[idx] = value[value.length - 1]; // Сохраняем только последний введенный символ
            return newCode;
        });

        // Переход к следующему input
        if (idx < 4 && value) {
            inputRefs.current[idx + 1]?.focus(); // Фокус на следующий input
        }

        // Снятие фокуса после заполнения последнего input
        if (idx === 4 && value) {
            inputRefs.current[idx]?.blur(); // Снимаем фокус
        }
    };

    const handleFocus = (index: number) => {
        if (code[index]) {
            inputRefs.current[index]?.select(); // Выделяем текст, если он есть
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
        if (e.key === 'Backspace') {
            // Очищаем текущий input
            setCode(prevCode => {
                const newCode = [...prevCode];
                newCode[idx] = ''; // Очищаем текущий input
                return newCode;
            });

            // Переход к предыдущему input, если это не первый input
            if (idx > 0) {
                inputRefs.current[idx - 1]?.focus(); // Фокус на предыдущий input
            }
        }
    };

    const handleGetCode = async() => {
        if (!isCode) {
        try {
            const result = await confirmUser({
                email: registerData?.email?.email
            })
            setIsCode(true)
        } catch (err) {
            setIsCode(false)
        }
        }
    }

    const handleRegister = async() => {
        if (isCode) {
            try {
                const result = await registerUser({
                    data: registerData,
                    code: code.join('')
                })
                dispatch(registerConfirm({}))
                navigator('/')
            } catch(err) {
                
            }
        
        }
    }

    return (
        <>
            <form action="" method='POST' onSubmit={(e) => e.preventDefault()}>
                <h1>Подтверждение E-mail</h1>
                <label htmlFor="">Ваша Почта</label>
                <div className="relative">
                    <input type="text" readOnly value={registerData?.email?.email || ''} />
                    {
                    isCode ? <Timer /> : null
                }
                </div>
                <div className="">
                    <button onClick={handleGetCode}>Отправить код</button>
                </div>
                <label htmlFor="">Введите код</label>
                <div className="email-confirm flex-row">
                    {code.map((_, index) => (
                        <div key={index}>
                            <input
                                type="text"
                                value={code[index]}
                                onChange={(e) => handlerChange(e, index)}
                                onFocus={() => handleFocus(index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                maxLength={1} // Ограничиваем ввод одним символом
                                ref={(el) => (inputRefs.current[index] = el)} // Сохраняем ref
                            />
                        </div>
                    ))}
                </div>
                
                <div className="">
                    <button onClick={handleRegister}>Зарегистрироваться</button>
                </div>

                <span>
                    <a
                        href=""
                        onClick={(e) => {
                            e.preventDefault();
                            navigator("/register");
                        }}
                    >
                        Назад
                    </a>
                </span>
            </form>
        </>
    );
};
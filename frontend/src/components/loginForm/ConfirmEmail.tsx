import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hooks';

export const ConfirmEmail = () => {
    const navigator = useNavigate();
    const dispatch = useAppDispatch();
    const registerData = useAppSelector(state => state.auth.user);
    const [code, setCode] = useState(Array(5).fill('')); // Инициализация пустыми строками
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]); // Рефы для input

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

    const handleRegister = () => {
        
    }

    return (
        <>
            <form action="" method='POST' onSubmit={(e) => e.preventDefault()}>
                <h1>Подтверждение E-mail</h1>
                <label htmlFor="">Ваша Почта</label>
                <div className="">
                    <input type="text" readOnly value={registerData?.email?.email || ''} />
                </div>
                <div className="">
                    <button>Отправить код</button>
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
                    <button>Зарегистрироваться</button>
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

import React from 'react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
    const navigator = useNavigate();

    return (

        <>
            <header className='flex-row'>
                <div className="header-background"></div>
                <div className="flex-row header-title-app">
                    <div className="logo-background"></div>
                    <div className="header-logo">
                    </div>
                    <div className="header-title" onClick={() => navigator("/")}>
                        ORBIS
                    </div>
                </div>
                <nav>
                    <ul className='flex-row'>
                        <li >
                            Загрузить
                        </li>
                        <li>
                            Узнать больше
                        </li>
                        <li>
                            Безопасность
                        </li>
                        <li>
                            Поддержка
                        </li>
                        <li>
                            Блог
                        </li>
                    </ul>
                </nav>
                <div className="header-button">
                    <button onClick={()=> navigator("/login")}>SING IN</button>
                </div>
            </header>
        </>
    )
}
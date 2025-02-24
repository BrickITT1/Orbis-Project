
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Header = () => {
    const navigator = useNavigate();
    const [burgerActive, setBurgerActive] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setBurgerActive(window.innerWidth > 1199);
            setBurgerActive(true)
        };

        window.addEventListener('resize', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
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
                <button className='burger' onClick={()=>(setBurgerActive(!burgerActive))}><img src="/img/burger.svg" alt="" /></button>
                <nav>
                    
                    <ul className={burgerActive ?'flex-row' : 'importantdisplay flex-col'}>
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
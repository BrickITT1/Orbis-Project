
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollToTop from '../scroll/Scroll00';
import ScrollTop from '../scroll/Top';

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
            <ScrollToTop />
            <ScrollTop />
            <div className="header-background"></div>
            <header className='flex-row'>
                
                <div className="flex-row header-title-app">
                    <div className="header-logo">
                    </div>
                    <div className="header-title" onClick={() => navigator("/")}>
                        ORBIS
                    </div>
                </div>
                <button className='burger' onClick={()=>(setBurgerActive(!burgerActive))}><img src="/img/burger.svg" alt="" /></button>
                <nav>
                    
                    <ul className={burgerActive ?'flex-row' : 'importantdisplay flex-col'}>
                        <li onClick={() => navigator("/")}>
                            Загрузить
                        </li>
                        <li onClick={() => navigator("/servers")}>
                            Узнать больше
                        </li>
                        <li onClick={() => navigator("/safety")}>
                            Безопасность
                        </li>
                        <li onClick={() => navigator("/")}>
                            Поддержка
                        </li>
                        <li onClick={() => navigator("/")}>
                            Новости
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
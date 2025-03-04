
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScrollToTop from '../scroll/Scroll00';
import ScrollTop from '../scroll/Top';

export const Header = () => {
    const navigator = useNavigate();
    const [burgerActive, setBurgerActive] = useState<boolean>(true);
    const burgerRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleResize = () => {
            setBurgerActive(window.innerWidth > 1199);
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (!burgerActive && burgerRef.current && !burgerRef.current.contains(event.target as Node)) {
                setBurgerActive(true);
            }
        };

        const handleScroll = ()=> {
            setBurgerActive(true);
        };
        

        window.addEventListener('resize', handleResize);
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener("scroll", handleScroll);

        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [])

    const handleBurger = useCallback((locate?: string)=> {
        if (locate) {
            navigator(locate)
        }

        if (window.innerWidth < 1199) {
            setBurgerActive(prevState => !prevState);
        }
        
    }, [])

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
                
                <nav ref={burgerRef}>
                    <button className='burger' onClick={()=>handleBurger()}><img src="/img/burger.svg" alt="" /></button>
                    <ul  className={burgerActive ? 'flex-row' : 'importantdisplay flex-col'} >
                        <li onClick={() => handleBurger('/')}>
                            Загрузить
                        </li>
                        <li onClick={() => handleBurger('/servers')}>
                            Узнать больше
                        </li>
                        <li onClick={() => handleBurger("/safety")}>
                            Безопасность
                        </li>
                        <li onClick={() => handleBurger("/")}>
                            Поддержка
                        </li>
                        <li onClick={() => handleBurger("/")}>
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
import React from "react";
import { useNavigate } from "react-router-dom";

export const NavBar: React.FC<{ styleContainer?: string; styleList?: string }> = (
    {styleContainer="", styleList=""}
) => {
    const navigator = useNavigate();
    return (
        <ul
            className={
                !(window.innerWidth < 1199)
                    ? `flex gap-10 ${styleContainer}`
                    : `top-40 flex-col bg-blue-950 w-full text-4xl ${styleContainer}`
            }
        >
            <li className={`p-3 ${styleList}`}><a href="#start"> Загрузить</a></li>
            <li className={`p-3 ${styleList}`}><a href="#more">Узнать больше</a></li>
            <li className={`p-3 ${styleList}`}><a onClick={()=>navigator('political')}></a>Политика</li>
            <li className={`p-3 ${styleList}`}><a href="#support">Поддержка</a></li>
        </ul>
    )
}
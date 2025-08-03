import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const ArticleNavigator: React.FC<{navigate: (order: number)=>void, order: number}> = ({navigate, order}) => {

    return (
        <div className="text-white">
            <h1 className=" text-3xl pb-5">Другие статьи</h1>
            <nav>
                <ul className="">
                    <li onClick={()=>navigate(1)} className={order === 1 ? "bg-[rgba(255,255,255,0.1)] w-70 p-2" : "w-70 p-2"}>
                        Условия использования
                    </li>
                    <li onClick={()=>navigate(3)} className={order === 3 ? "bg-[rgba(255,255,255,0.1)] w-70 p-2" : "w-70 p-2"}>
                        Политика конфиденциальности
                    </li>
                    <li onClick={()=>navigate(2)} className={order === 2 ? "bg-[rgba(255,255,255,0.1)] w-70 p-2" : "w-70 p-2"}>
                        Политика безопасности
                    </li>
                    <li onClick={()=>navigate(0)} className={order === 0 ? "bg-[rgba(255,255,255,0.1)] w-70 p-2" : "w-70 p-2"}>
                        Лицензионное соглашение
                    </li>
                </ul>
            </nav>
        </div>
    );
};

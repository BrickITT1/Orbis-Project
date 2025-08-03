import React, { useEffect, useState } from "react";
import { throttle } from "@/utils/throttle";

export default function ScrollTop() {
    const [isVisible, setIsVisible] = useState(false); // Состояние видимости кнопки

    useEffect(() => {
        const handleScroll = () => {
            // Показываем кнопку, если пользователь проскроллил больше, чем 100vh
            if (window.scrollY > window.innerHeight - 100) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        // Троттлинг функции handleScroll (вызов не чаще, чем каждые 100 мс)
        const throttledHandleScroll = throttle(handleScroll, 100);

        // Добавляем обработчик события scroll
        window.addEventListener("scroll", throttledHandleScroll);

        // Убираем обработчик при размонтировании компонента
        return () => {
            window.removeEventListener("scroll", throttledHandleScroll);
        };
    }, []);

    return (
        <>
            <div
                className={`fixed-container ${isVisible ? "visible" : "hidden"}`}
            >
                <button
                    onClick={() =>
                        window.scrollTo({
                            top: 0,
                            behavior: "smooth",
                        })
                    }
                >
                    <svg
                        width="60"
                        height="60"
                        viewBox="0 0 60 60"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M30 40V20M30 20L23.75 26.25M30 20L36.25 26.25M52.5 30C52.5 34.4501 51.1804 38.8002 48.7081 42.5003C46.2357 46.2004 42.7217 49.0843 38.6104 50.7873C34.499 52.4903 29.9751 52.9358 25.6105 52.0677C21.2459 51.1995 17.2368 49.0566 14.0901 45.9099C10.9434 42.7632 8.80051 38.7541 7.93234 34.3895C7.06417 30.025 7.50975 25.501 9.21272 21.3896C10.9157 17.2783 13.7996 13.7643 17.4997 11.2919C21.1998 8.8196 25.5499 7.5 30 7.5C35.9674 7.5 41.6903 9.87053 45.9099 14.0901C50.1295 18.3097 52.5 24.0326 52.5 30Z"
                            stroke="white"
                            strokeWidth="2.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>
        </>
    );
}

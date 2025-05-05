import React, { useEffect, useRef, useState } from "react";

const CustomScroll: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeout = useRef<any>(null); // Таймер для сброса стиля

    useEffect(() => {
        // Отключаем стандартный скролл
        document.body.style.overflow = "hidden";

        const header = document.querySelector("header");

        const handleScroll = () => {
            if (header) {
                // Если страница в стартовом состоянии (scrollY === 0)
                if (window.scrollY === 0) {
                    // Очищаем таймер и убираем стиль у хедера
                    if (scrollTimeout.current) {
                        clearTimeout(scrollTimeout.current);
                        scrollTimeout.current = null;
                    }
                    header.classList.remove("scrolled");
                    return; // Выходим из функции, чтобы не добавлять стиль
                }

                // Добавляем стиль при скролле
                header.classList.add("scrolled");

                // Сбрасываем предыдущий таймер, если он есть
                if (scrollTimeout.current) {
                    clearTimeout(scrollTimeout.current);
                }

                // Устанавливаем новый таймер для сброса стиля
                scrollTimeout.current = setTimeout(() => {
                    // Проверяем, что скролл действительно остановился
                    if (!isScrolling) {
                        header.classList.remove("scrolled");
                    }
                }, 1000); // Сбрасываем стиль через 1000 мс после остановки скролла
            }
        };

        const handleWheel = (event: WheelEvent) => {
            event.preventDefault(); // Отменяем стандартное поведение скролла

            if (isScrolling) return; // Если уже происходит скролл, выходим
            setIsScrolling(true);

            const delta = event.deltaY; // Направление скролла (вниз > 0, вверх < 0)
            const currentScroll = window.scrollY; // Текущая позиция скролла
            const viewportHeight = window.innerHeight; // Высота окна (100vh)

            let targetScroll;

            if (delta > 0) {
                // Скролл вниз
                targetScroll = currentScroll + viewportHeight;
            } else {
                // Скролл вверх
                targetScroll = currentScroll - viewportHeight;
            }

            // Ограничиваем targetScroll в пределах страницы
            targetScroll = Math.max(
                0,
                Math.min(
                    targetScroll,
                    document.body.scrollHeight - viewportHeight,
                ),
            );

            // Плавно прокручиваем страницу
            window.scrollTo({
                top: targetScroll,
                behavior: "smooth",
            });

            // Разрешаем следующий скролл после завершения текущего
            setTimeout(() => {
                setIsScrolling(false);
            }, 500); // Задержка для завершения анимации скролла
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            const viewportHeight = window.innerHeight;
            const currentScroll = window.scrollY;
            let targetScroll;

            switch (event.key) {
                case "ArrowDown":
                case "PageDown":
                case " ":
                    targetScroll = currentScroll + viewportHeight;
                    break;
                case "ArrowUp":
                case "PageUp":
                    targetScroll = currentScroll - viewportHeight;
                    break;
                default:
                    return;
            }

            targetScroll = Math.max(
                0,
                Math.min(
                    targetScroll,
                    document.body.scrollHeight - viewportHeight,
                ),
            );

            window.scrollTo({
                top: targetScroll,
                behavior: "smooth",
            });
        };

        // Добавляем обработчики событий
        window.addEventListener("scroll", handleScroll);
        window.addEventListener("wheel", handleWheel, { passive: false });
        window.addEventListener("keydown", handleKeyDown);

        // Убираем обработчики при размонтировании компонента
        return () => {
            document.body.style.overflow = ""; // Восстанавливаем стандартный скролл
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current); // Очищаем таймер
            }
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("wheel", handleWheel);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isScrolling]);

    return <div>{children}</div>;
};

export default CustomScroll;

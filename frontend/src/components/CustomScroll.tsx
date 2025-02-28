import React, { useEffect, useState } from 'react';

const CustomScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    // Отключаем стандартный скролл
    document.body.style.overflow = 'hidden';
    const header = document.querySelector('header')

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
        header?.classList?.add('hide-head');
        targetScroll = currentScroll + viewportHeight;
      } else {
        // Скролл вверх
        header?.classList?.remove('hide-head');
        targetScroll = currentScroll - viewportHeight;
      }

      // Ограничиваем targetScroll в пределах страницы
      targetScroll = Math.max(0, Math.min(targetScroll, document.body.scrollHeight - viewportHeight));

      // Плавно прокручиваем страницу
      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
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
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
            header?.classList?.add('hide-head');
          targetScroll = currentScroll + viewportHeight;
          break;
        case 'ArrowUp':
        case 'PageUp':
            header?.classList?.remove('hide-head');
          targetScroll = currentScroll - viewportHeight;
          break;
        default:
          return;
      }

      targetScroll = Math.max(0, Math.min(targetScroll, document.body.scrollHeight - viewportHeight));

      window.scrollTo({
        top: targetScroll,
        behavior: 'smooth',
      });
    };

    // Добавляем обработчики событий
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    // Убираем обработчики при размонтировании компонента
    return () => {
      document.body.style.overflow = 'auto'; // Восстанавливаем стандартный скролл
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isScrolling]);

  return <div>{children}</div>;
};

export default CustomScroll;
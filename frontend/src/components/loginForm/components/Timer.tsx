import React, { useState, useEffect } from 'react';

const Timer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(60); // Начальное значение таймера

  useEffect(() => {
    if (timeLeft === 0) return; // Останавливаем таймер, когда время вышло

    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1); // Уменьшаем время на 1 секунду
    }, 1000);

    return () => clearInterval(intervalId); // Очищаем интервал при размонтировании компонента
  }, [timeLeft]);

  return (
    <div className='form-timer'>
        {timeLeft === 0 ? null : <div>{timeLeft} с</div>}
    </div>
  );
};

export default Timer;
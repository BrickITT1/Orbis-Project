const mediasoup = require('mediasoup');

// Основная функция создания и настройки Mediasoup Worker и Router
module.exports.createWorker = async () => {
  /**
   * Создание Worker процесса
   * Worker - изолированный процесс для обработки медиа данных
   * Параметры:
   * - logLevel: уровень детализации логов (debug, warn, error)
   * - rtcMinPort/rtcMaxPort: диапазон портов для RTC-соединений
   * 
   * Особенности:
   * - Отдельный процесс для изоляции сбоев
   * - Пул портов для масштабирования подключений
   */
  const worker = await mediasoup.createWorker({
    logLevel: 'debug',        // Детальные логи для отладки
    rtcMinPort: 40000,       // Минимальный порт для WebRTC
    rtcMaxPort: 49999        // Максимальный порт для WebRTC
  });

  /**
   * Обработчик аварийного завершения Worker
   * Важно для мониторинга и восстановления сервиса
   */
  worker.on('died', () => {
    console.error('[Mediasoup] Критическая ошибка: Worker процесс завершился');
    process.exit(1); // Принудительное завершение приложения
  });

  /**
   * Создание Router - ядра медиа маршрутизации
   * Router обрабатывает:
   * - Создание транспортов
   * - Управление производителями/потребителями
   * - Согласование кодеков
   * 
   * mediaCodecs: список поддерживаемых кодеков
   */
  const router = await worker.createRouter({
    mediaCodecs: [
      // Конфигурация аудио кодека Opus
      {
        kind: 'audio',
        mimeType: 'audio/opus',       // Современный аудио кодек
        clockRate: 48000,             // Стандартная частота дискретизации
        channels: 2,                  // Стерео звучание
        parameters: {
          useinbandfec: 1,            // Включение FEC (коррекция ошибок)
          stereo: 1,                  // Стерео режим
          minptime: 10                // Минимальный размер пакета (10 мс)
        }
      },
      // Конфигурация видео кодека VP8
      {
        kind: 'video',
        mimeType: 'video/VP8',        // Открытый видео кодек
        clockRate: 90000,             // Стандартная частота для видео
        parameters: {
          'x-google-start-bitrate': 1000 // Стартовый битрейт 1000 кбит/с
        }
      },
      // Конфигурация видео кодека H264
      {
        kind: 'video',
        mimeType: 'video/H264',       // Популярный кодек для совместимости
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,    // Режим упаковки NAL-юнитов
          'profile-level-id': '42e01f', // Профиль Baseline Level 3.1
          'level-asymmetry-allowed': 1 // Разрешение асимметрии уровней
        }
      }
    ]
  });

  // Возвращаем созданные объекты
  return { 
    worker, // Процесс обработки медиа
    router  // Маршрутизатор медиапотоков
  };
};
// Обработчик нажатия кнопки присоединения к комнате
document.getElementById('join-button').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const roomId = document.getElementById('room-id').value;

  if (username && roomId) {
    // Инициализация Socket.IO соединения
    const socket = io();
    
    // Отправка события присоединения к комнате
    socket.emit('joinRoom', { username, roomId });

    // Переключение видимости элементов интерфейса
    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('controls').style.display = 'block';
    document.getElementById('participant-view').style.display = 'block';

    let localStream;
    let audioEnabled = true;
    let videoEnabled = true;

    // Запрос доступа к медиаустройствам
    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(stream => {
        localStream = stream;
        
        // Добавление локального видеоэлемента
        addParticipantVideo('local', stream);

        // Уведомление других участников о новом подключении
        socket.emit('newParticipant', { id: 'local', stream });

        // Обработчик новых участников
        socket.on('newParticipant', ({ id, stream }) => {
          addParticipantVideo(id, stream);
        });

        // Обработчик выхода участников
        socket.on('participantLeft', id => {
          removeParticipantVideo(id);
        });
      })
      .catch(error => {
        console.error('Ошибка доступа к устройствам:', error);
        alert('Необходимо разрешить доступ к камере и микрофону!');
      });

    // Обработчик кнопки отключения микрофона
    document.getElementById('mute-button').addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      localStream.getAudioTracks()[0].enabled = audioEnabled;
      document.getElementById('mute-button').textContent = 
        audioEnabled ? 'Mute' : 'Unmute';
    });

    // Обработчик кнопки отключения видео
    document.getElementById('video-button').addEventListener('click', () => {
      videoEnabled = !videoEnabled;
      localStream.getVideoTracks()[0].enabled = videoEnabled;
      document.getElementById('video-button').textContent = 
        videoEnabled ? 'Stop Video' : 'Start Video';
    });

    // Обработчик выхода из комнаты
    document.getElementById('leave-button').addEventListener('click', () => {
      // Отправка события выхода
      socket.emit('leaveRoom', { username, roomId });
      
      // Остановка всех медиапотоков
      localStream.getTracks().forEach(track => track.stop());
      
      // Разрыв соединения
      socket.disconnect();

      // Восстановление начального состояния интерфейса
      document.getElementById('join-screen').style.display = 'block';
      document.getElementById('controls').style.display = 'none';
      document.getElementById('participant-view').style.display = 'none';
      document.getElementById('participant-view').innerHTML = '';
    });

    // Подтверждение успешного присоединения
    socket.on('roomJoined', (data) => {
      console.log(`Успешно присоединились к комнате ${data.roomId} как ${data.username}`);
    });

    // Обработчик ошибок соединения
    socket.on('connect_error', (error) => {
      console.error('Ошибка подключения:', error);
      alert('Ошибка соединения с сервером!');
    });
  } else {
    alert('Пожалуйста, введите имя и ID комнаты');
  }
});

/**
 * Добавление видеоэлемента участника
 * @param {string} id - Уникальный идентификатор участника
 * @param {MediaStream} stream - Медиапоток
 */
const addParticipantVideo = (id, stream) => {
  const videoElement = document.createElement('video');
  videoElement.id = id; // Присваиваем уникальный ID
  videoElement.srcObject = stream; // Привязываем медиапоток
  videoElement.autoplay = true; // Автовоспроизведение
  videoElement.playsInline = true; // Для мобильных устройств
  document.getElementById('participant-view').appendChild(videoElement);
};

/**
 * Удаление видеоэлемента участника
 * @param {string} id - Уникальный идентификатор участника
 */
const removeParticipantVideo = (id) => {
  const videoElement = document.getElementById(id);
  if (videoElement) {
    // Остановка всех треков потока
    videoElement.srcObject.getTracks().forEach(track => track.stop());
    // Удаление элемента из DOM
    videoElement.remove();
  }
};

// Глобальные переменные Mediasoup
let device;          // Устройство Mediasoup
let sendTransport;   // Транспорт для отправки медиа
let recvTransport;   // Транспорт для получения медиа

/**
 * Инициализация Mediasoup после присоединения к комнате
 */
socket.emit('joinRoom', { username, roomId }, async (response) => {
  // Инициализация медиаустройства
  device = new mediasoupClient.Device();
  
  // Загрузка возможностей роутера
  await device.load({ 
    routerRtpCapabilities: response.rtpCapabilities 
  });
  
  // Создание транспорта для отправки
  sendTransport = device.createSendTransport({
    id: response.transport.id,
    iceParameters: response.transport.iceParameters, // ICE параметры
    iceCandidates: response.transport.iceCandidates, // Список кандидатов
    dtlsParameters: response.transport.dtlsParameters // DTLS настройки
  });

  /**
   * Обработчик установки соединения транспорта
   * Отправляет DTLS параметры на сервер
   */
  sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    socket.emit('transport-connect', { dtlsParameters }, () => callback());
  });

  /**
   * Обработчик создания продюсера
   * Регистрирует новый медиапоток на сервере
   */
  sendTransport.on('produce', async (parameters, callback, errback) => {
    socket.emit('produce', parameters, ({ id }) => callback({ id }));
  });

  // Создание аудио продюсера
  const audioProducer = await sendTransport.produce({ 
    track: localStream.getAudioTracks()[0] 
  });

  // Создание видео продюсера
  const videoProducer = await sendTransport.produce({ 
    track: localStream.getVideoTracks()[0] 
  });
});

/**
 * Обработка новых медиапотоков от других участников
 */
socket.on('newProducer', async ({ peerId, producerId, kind }) => {
  // Создание консьюмера для нового потока
  const consumer = await recvTransport.consume({
    producerId,
    rtpCapabilities: device.rtpCapabilities,
    paused: true // Начальное состояние паузы
  });
  
  // Создание медиапотока из трека
  const stream = new MediaStream();
  stream.addTrack(consumer.track);
  
  // Добавление элемента в интерфейс
  addParticipantVideo(peerId, stream);
  
  // Отправка запроса на возобновление потока
  socket.emit('resume', { consumerId: consumer.id });
});
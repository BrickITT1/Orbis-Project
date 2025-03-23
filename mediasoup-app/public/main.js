document.getElementById('join-button').addEventListener('click', () => {{
  const username = document.getElementById('username').value;
  const roomId = document.getElementById('room-id').value;

  if (username && roomId) {
    const socket = io();
    socket.emit('joinRoom', { username, roomId });

    document.getElementById('join-screen').style.display = 'none';
    document.getElementById('controls').style.display = 'block';
    document.getElementById('participant-view').style.display = 'block';

    let localStream;
    let audioEnabled = true;
    let videoEnabled = true;

    navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      .then(stream => {
        localStream = stream;
        addParticipantVideo('local', stream);

        // Emit local stream to other participants
        socket.emit('newParticipant', { id: 'local', stream });

        // Listen for new participants
        socket.on('newParticipant', ({ id, stream }) => {
          addParticipantVideo(id, stream);
        });

        // Listen for participant leaving
        socket.on('participantLeft', id => {
          removeParticipantVideo(id);
        });
      })
      .catch(error => {
        console.error('Error accessing media devices.', error);
        alert('Could not access your camera and microphone. Please check your permissions.');
      });

    document.getElementById('mute-button').addEventListener('click', () => {
      audioEnabled = !audioEnabled;
      localStream.getAudioTracks()[0].enabled = audioEnabled;
      document.getElementById('mute-button').textContent = audioEnabled ? 'Mute' : 'Unmute';
    });

    document.getElementById('video-button').addEventListener('click', () => {
      videoEnabled = !videoEnabled;
      localStream.getVideoTracks()[0].enabled = videoEnabled;
      document.getElementById('video-button').textContent = videoEnabled ? 'Stop Video' : 'Start Video';
    });

    document.getElementById('leave-button').addEventListener('click', () => {
      socket.emit('leaveRoom', { username, roomId });
      localStream.getTracks().forEach(track => track.stop());
      socket.disconnect();

      document.getElementById('join-screen').style.display = 'block';
      document.getElementById('controls').style.display = 'none';
      document.getElementById('participant-view').style.display = 'none';
      document.getElementById('participant-view').innerHTML = '';
    });

    socket.on('roomJoined', (data) => {
      console.log(`Joined room ${data.roomId} as ${data.username}`);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      alert('Connection failed. Please try again.');
    });
  } else {
    alert('Please enter your name and room ID');
  }
}});

const addParticipantVideo = (id, stream) => {
  const videoElement = document.createElement('video');
  videoElement.id = id;
  videoElement.srcObject = stream;
  videoElement.autoplay = true;
  document.getElementById('participant-view').appendChild(videoElement);
};

const removeParticipantVideo = (id) => {
  const videoElement = document.getElementById(id);
  if (videoElement) {
    videoElement.srcObject.getTracks().forEach(track => track.stop());
    videoElement.remove();
  }
};
let device;
let rtpCapabilities;
let sendTransport;
let recvTransport;

// После подключения к комнате
socket.emit('joinRoom', { username, roomId }, async (response) => {
  // Инициализация медиасервера
  device = new mediasoupClient.Device();
  await device.load({ routerRtpCapabilities: response.rtpCapabilities });
  
  // Создаем транспорт для отправки
  sendTransport = device.createSendTransport({
    id: response.transport.id,
    iceParameters: response.transport.iceParameters,
    iceCandidates: response.transport.iceCandidates,
    dtlsParameters: response.transport.dtlsParameters,
  });

  // Обработка событий транспорта
  sendTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    socket.emit('transport-connect', { dtlsParameters }, () => callback());
  });

  sendTransport.on('produce', async (parameters, callback, errback) => {
    socket.emit('produce', parameters, ({ id }) => callback({ id }));
  });

  // Создаем продюсеры для аудио и видео
  const audioProducer = await sendTransport.produce({ track: localStream.getAudioTracks()[0] });
  const videoProducer = await sendTransport.produce({ track: localStream.getVideoTracks()[0] });
});

// Обработка новых участников
socket.on('newProducer', async ({ peerId, producerId, kind }) => {
  const consumer = await recvTransport.consume({
    producerId,
    rtpCapabilities: device.rtpCapabilities,
    paused: true,
  });
  
  const stream = new MediaStream();
  stream.addTrack(consumer.track);
  addParticipantVideo(peerId, stream);
  
  socket.emit('resume', { consumerId: consumer.id });
});
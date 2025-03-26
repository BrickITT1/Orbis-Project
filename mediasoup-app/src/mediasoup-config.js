const mediasoup = require('mediasoup');

module.exports.createWorker = async () => {
  const worker = await mediasoup.createWorker({
    logLevel: 'debug',
    rtcMinPort: 40000,
    rtcMaxPort: 49999
  });

  worker.on('died', () => {
    console.error('Mediasoup worker died, exiting...');
    process.exit(1);
  });

  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
        parameters: {
          useinbandfec: 1,
          stereo: 1,
          minptime: 10
        }
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
          'x-google-start-bitrate': 1000
        }
      },
      
      {
        kind: 'video',
        mimeType: 'video/H264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '42e01f',
          'level-asymmetry-allowed': 1
        }
      }
    ]
  });

  return { worker, router };
};
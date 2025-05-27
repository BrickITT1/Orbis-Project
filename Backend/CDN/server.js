import express from 'express';
import serveStatic from 'serve-static';
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { createClient } from 'redis';
import dotenv from 'dotenv';
import axios from 'axios';
import https from 'https';

const options = {
  key: fs.readFileSync('./selfsigned_key.pem'),
  cert: fs.readFileSync('./selfsigned.pem'),
};

dotenv.config();

const app = express();

const server = https.createServer(options, app);
const PORT = process.env.PORT || 3006;
const __dirname = path.resolve();

// Redis client
const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect().catch(console.error);

// Middleware
app.use(cors({
    origin: "https://26.234.138.233:5173",
    credentials: true,
}));
app.use(morgan('combined'));
app.use(compression());

// MIME helper
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.html': 'text/html',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.pdf': 'application/pdf'
  };
  return types[ext] || 'application/octet-stream';
}

// Redis + CDN кеш
app.get('/cdn/:folder?/:filename', async (req, res) => {
  const folder = req.params.folder ? `${req.params.folder}/` : '';
  const filePath = path.join(__dirname, 'public', folder, req.params.filename);
  const cacheKey = `cdn:${folder}${req.params.filename}`;

  try {
    await fs.promises.access(filePath);

    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const buffer = Buffer.from(cached, 'base64');
      res.setHeader('Content-Type', getMimeType(filePath));
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(buffer);
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    if (fileBuffer.length < 5 * 1024 * 1024) {
      await redisClient.setEx(cacheKey, 3600, fileBuffer.toString('base64'));
    }

    res.setHeader('Content-Type', getMimeType(filePath));
    res.setHeader('Content-Length', fileBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(fileBuffer);

  } catch (err) {
    return res.status(404).send('Файл не найден');
  }
});

// Медиа с поддержкой Range-запросов
app.get('/media/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'public', req.params.filename);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) return res.status(404).send('Not found');

    const range = req.headers.range;
    if (!range) {
      res.writeHead(200, {
        'Content-Length': stats.size,
        'Content-Type': getMimeType(filePath),
      });
      return fs.createReadStream(filePath).pipe(res);
    }

    const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : stats.size - 1;

    if (start >= stats.size || end >= stats.size) {
      res.status(416).send('Requested range not satisfiable');
      return;
    }

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stats.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': getMimeType(filePath),
    });

    fs.createReadStream(filePath, { start, end }).pipe(res);
  });
});

// Загрузка файлов для мессенджера
const uploadDir = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/', 'video/', 'audio/', 'application/'];
    if (allowed.some(type => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла'));
    }
  },
});

app.get('/download', async (req, res) => {
  const fileUrl = req.query.url;
  const response = await axios.get(fileUrl, { responseType: 'stream' });
  
  res.setHeader('Content-Disposition', `attachment; filename="file.pdf"`);
  response.data.pipe(res);
});

// Здесь ключ поля 'files' должен совпадать с тем, что отправляет клиент
app.post('/upload', upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Нет загруженных файлов' });
  }

  const urls = req.files.map(file => {
    return `${req.protocol}://${req.get('host')}/cdn/uploads/${file.filename}`;
  });

  res.status(200).json({ uploaded: urls });
});

// Отдача статичных файлов
app.use('/', serveStatic(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: true,
}));

// 404 fallback
app.use((req, res) => {
  res.status(404).send('Файл не найден');
});

server.listen(PORT, () => {
  console.log(`🚀 CDN-сервер запущен: https://localhost:${PORT}`);
});



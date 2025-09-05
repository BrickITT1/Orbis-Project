import express from 'express';
import type { Request, Response } from 'express';
import serveStatic from 'serve-static';
import compression from 'compression';
import morgan from 'morgan';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import dotenv from 'dotenv';
import axios from 'axios';
import https from 'https';
import { connectRedis, redisClient } from './config/redis.config';

dotenv.config();
const { diskStorage } = multer;
type FileFilterCallback = import('multer').FileFilterCallback;
const options = {
  key: fs.readFileSync('./selfsigned_key.pem'),
  cert: fs.readFileSync('./selfsigned.pem'),
};

const app = express();
const server = https.createServer(options, app);
const PORT = process.env.PORT || 3006;
const __dirnameResolved = path.resolve();

// Redis client
connectRedis();

// Middleware
app.use(cors({
  origin:  process.env.FRONTENDADDRES || "https://26.234.138.233:5173",
  credentials: true,
}));
app.use(morgan('combined'));
app.use(compression());

// MIME helper
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const types: Record<string, string> = {
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

// CDN + Redis cache
app.get('/cdn/:folder?/:filename', async (req: Request, res: Response) => {
  const folder = req.params.folder ? `${req.params.folder}/` : '';
  const filePath = path.join(__dirnameResolved, 'public', folder, req.params.filename || '');
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

// Media with Range support
app.get('/media/:filename', (req: Request, res: Response) => {
  const filePath = path.join(__dirnameResolved, 'public', req.params.filename);

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

// Upload handler
const uploadDir = path.join(__dirnameResolved, 'public', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb: FileFilterCallback) => {
    const allowed = ['image/', 'video/', 'audio/', 'application/'];
    if (allowed.some(type => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Недопустимый тип файла'));
    }
  },
});


app.get('/download', async (req: Request, res: Response) => {
  const fileUrl = req.query.url as string;
  if (!fileUrl) return res.status(400).send('Missing URL');

  try {
    const response = await axios.get(fileUrl, { responseType: 'stream' });
    res.setHeader('Content-Disposition', `attachment; filename="file.pdf"`);
    response.data.pipe(res);
  } catch (err) {
    res.status(500).send('Ошибка загрузки');
  }
});

// Upload endpoint
app.post('/upload', upload.array('files', 5), (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'Нет загруженных файлов' });
  }

  const urls = files.map(file => {
    return `${req.protocol}://${req.get('host')}/cdn/uploads/${file.filename}`;
  });

  res.status(200).json({ uploaded: urls });
});

// Static serving
app.use('/', serveStatic(path.join(__dirnameResolved, 'public'), {
  maxAge: '1d',
  etag: true,
}));

// Fallback 404
app.use((req: Request, res: Response) => {
  res.status(404).send('Файл не найден');
});

server.listen(PORT, () => {
  console.log(`🚀 CDN-сервер запущен: https://localhost:${PORT}`);
  console.log(`Server for frontend: ${ process.env.FRONTENDADDRES || "https://26.234.138.233:5173"}`);
});

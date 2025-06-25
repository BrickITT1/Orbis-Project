import { Socket } from 'socket.io';
import type {AuthenticatedSocket} from '../types/socket'
import jwt, { JwtPayload } from 'jsonwebtoken';

export const authenticateSocket = (
  socket: Socket,
  next: (err?: Error) => void
) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Токен отсутствует'));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as JwtPayload;

    (socket as AuthenticatedSocket).user = decoded?.id;
    (socket as AuthenticatedSocket).token = token;
   
    if (!decoded) {
      return next(new Error('Неверный токен'));
    }
    
    next();
  } catch (err) {
    console.log(err)
    return next(new Error('Неверный токен'));
  }
};
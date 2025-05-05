import jwt from 'jsonwebtoken'

export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  
  if (!token) {
    return res.status(401).json({ error: "Access token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid access token" });
  }
};

export const authenticateSocket = (socket, next) => {
  const token = socket.handshake.auth.token;
 
  if (!token) {
    return next(new Error('Токен отсутствует'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    socket.user = decoded; // Сохраняем данные пользователя в сокете
    
    next();
  } catch (err) {
    return next(new Error('Неверный токен'));
  }
};

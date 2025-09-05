import jwt, { JwtPayload } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import type { Socket } from "socket.io";
import type { AuthenticatedSocket } from "../types/socket";

// Типизация для user, можно расширить по необходимости
interface AuthenticatedRequest extends Request {
    user?: string | JwtPayload;
}

export const authenticate = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access token missing" });
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Invalid access token" });
    }
};

export const authenticateSocket = (
    socket: Socket,
    next: (err?: Error) => void,
) => {
    const token = socket.handshake.auth.token;

    if (!token) {
        return next(new Error("Токен отсутствует"));
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET!,
        ) as AuthenticatedSocket["user"];
        (socket as AuthenticatedSocket).user = decoded;
        next();
    } catch (err) {
        next(new Error("Неверный токен"));
    }
};

import jwt from "jsonwebtoken";
import { redisClient } from "../config/redis.config";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import { prisma } from '../config/prismaClient';


export const sendCodeCheck = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;

        // Валидация email
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: "Valid email is required" });
        }

        // Генерация 10-значного цифрового кода
        const code = Math.floor(
            1000000000 + Math.random() * 9000000000,
        ).toString();
        // Сохранение в Redis на 5 минут (300 секунд)
        await redisClient.setEx(email, 300, code);
        console.log(`Verification code ${code} generated for ${email}`);

        // В реальном приложении здесь должна быть отправка кода по email
        // Например: await sendEmail(email, code);
        res.json({
            message: "Verification code generated and stored",
            email,
            code, // В продакшне не возвращайте код в ответе!
        });
    } catch (err) {
        console.error("Error in sendCodeCheck:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const verifyCode = async (req: Request, res: Response) => {
    try {
        const { email, code } = req.body;

        // Валидация входных данных
        if (!email || !code) {
            return res
                .status(400)
                .json({ error: "Email and code are required" });
        }

        // Получаем код из Redis
        const storedCode = await redisClient.get(email);

        if (!storedCode) {
            return res.status(404).json({ error: "Code not found or expired" });
        }

        // Сравниваем коды (без учета регистра, если нужно)
        if (storedCode !== code) {
            return res.status(401).json({ error: "Invalid verification code" });
        }

        // Удаляем код из Redis после успешной проверки
        await redisClient.del(email);

        res.json({
            message: "ok",
            verified: true,
        });
    } catch (err) {
        console.error("Error in verifyCode:", err);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, display_name, username, birth_date } =
            req.body;

        // Валидация обязательных полей
        if (!email || !password || !display_name || !username || !birth_date) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Проверка формата email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Invalid email format" });
        }

        // Проверка сложности пароля
        if (password.length < 8) {
            return res
                .status(400)
                .json({ error: "Password must be at least 8 characters long" });
        }

        // Проверка уникальности email и username
        const existingUser = await prisma.users.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            return res
                .status(409)
                .json({ error: "Email or username already exists" });
        }

        // Хеширование пароля
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Преобразование даты рождения
        // Преобразование и валидация даты рождения
        const birthDate = new Date(birth_date);

        // Проверка на валидную дату
        if (isNaN(birthDate.getTime())) {
            return res.status(400).json({ error: "Invalid birth date format" });
        }

        // Проверка диапазона (например, пользователи не старше 120 лет и не младше 13)
        const now = new Date();
        const earliestAllowed = new Date(now.getFullYear() - 120, 0, 1); // примерно 1905
        const latestAllowed = new Date(now.getFullYear() - 13, 11, 31); // минимум 13 лет

        if (birthDate < earliestAllowed || birthDate > latestAllowed) {
            return res.status(400).json({ error: "Birth date is out of allowed range" });
        }

        const user = await prisma.users.create({
            data: {
                email,
                password_hash: hashedPassword,
                username,
                user_profile: {
                create: {
                    birth_date: birthDate,
                    avatar_url: '/img/icon.png',
                },
                },
                user_preferences: {
                create: {},
                },
            },
            include: {
                user_profile: true,
                user_preferences: true,
            },
            });

        // Удаляем verification code из Redis если он был
        await redisClient.del(email);

        // Генерация JWT токена (опционально)
        // const token = generateToken(result.rows[0].id);

        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user.id,
            },
            // token: token // если используется JWT
        });
    } catch (err: any) {
        console.error("Registration error:", err);
        if (err.code === 'P2002') { // Prisma unique constraint error code
            return res.status(409).json({ error: "User already exists" });
        }
        res.status(500).json({ error: "Internal server error" });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.users.findUnique({
            where: { email },
            include: {
                user_profile: true,
                user_preferences: true,
                },
            });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash ?? "");
        if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
        }

        const accessToken = jwt.sign(
            { id: user.id },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: "15m" }
        );
        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.REFRESH_TOKEN_SECRET!,
            { expiresIn: "7d" }
        );

        res.clearCookie("refresh_token", {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            path: "/",
        });

        res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.json({
            access_token: accessToken,
            username: user.username,
            info: {
                id: user.id,
                username: user.username,
                avatar_url: user.user_profile?.avatar_url || null,
                email: user.email
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const refresh = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token missing" });
    }

    try {
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET!,
        ) as jwt.JwtPayload;
        
        const user = await prisma.users.findUnique({
            where: { id: decoded.id },
            include: {
                user_profile: true,
            },
        });

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Генерация нового access-токена
        const accessToken = jwt.sign(
            { id: user.id },
            process.env.ACCESS_TOKEN_SECRET!,
            {
                expiresIn: "15m",
            },
        );

        res.json({
            access_token: accessToken,
            username: user.username,
            info: {
                id: user.id,
                username: user.username,
                avatar_url: user.user_profile?.avatar_url || null,
            },
        });
    } catch (error) {
        console.log(error);
        res.status(401).json({ error: "Invalid refresh token" });
    }
};

export const protectedRoute = (req: Request, res: Response) => {
    res.json({ message: "This is a protected route", user: (req as any).user });
};

export const logout = (req: Request, res: Response) => {
    res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: false, // Для локальной разработки
        sameSite: "lax", // Для локальной разработки
        path: "/", // Указываем путь
    });
    res.json({ message: "User logout" });
};

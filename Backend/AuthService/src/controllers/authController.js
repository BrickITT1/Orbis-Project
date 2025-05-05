import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
  
      const isPasswordValid = password == user.password;
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
  
      const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "15m",
      });
  
      const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: "7d",
      });
  
      res.cookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure: false,
        sameSite: "Strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
  
      res.json({ access_token: accessToken, username: user.id });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  };

export const refresh = async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ error: "Refresh token missing" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Генерация нового access-токена
    const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "15m",
    });
    res.json({ access_token: accessToken, username: user.user_name });
  } catch (error) {
    res.status(401).json({ error: "Invalid refresh token" });
  }
};

export const protectedRoute = (req, res) => {
  res.json({ message: "This is a protected route", user: req.user });
};

export const logout = (req, res) => {
    res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: false, // Для локальной разработки
        sameSite: "Lax", // Для локальной разработки
        path: "/", // Указываем путь
      });
    res.json({message: 'User logout'})
}

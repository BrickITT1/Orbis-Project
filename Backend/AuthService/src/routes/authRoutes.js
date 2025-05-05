import express from 'express';
import  { login, refresh, protectedRoute, logout } from "../controllers/authController.js"
import  { authenticate } from "../middleware/authMiddleware.js";

export const authRoutes = express.Router();

authRoutes.post("/login", login);
authRoutes.post("/logout", logout)
authRoutes.post("/refresh", refresh);
authRoutes.get('/refresh', refresh);
authRoutes.get("/protected", authenticate, protectedRoute);

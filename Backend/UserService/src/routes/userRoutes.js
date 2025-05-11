import express from 'express';

import { getFastUserInfo, getUserInfo, getUsersOnServer } from "../controllers/userController.js";

export const userRouter = express.Router();

//userRouter.get("/user/:id", getUserInfo);
userRouter.get("/user/:id", getUserInfo);
userRouter.get("/userserver/:id", getUsersOnServer);

import express from 'express';

import {  getUserInfo, getUsersOnServer, getUsersFriends } from "../controllers/userController.js";

export const userRouter = express.Router();

//userRouter.get("/user/:id", getUserInfo);
userRouter.get("/user/friends", getUsersFriends);
userRouter.get("/user/:id", getUserInfo);
userRouter.get("/userserver/:id", getUsersOnServer);


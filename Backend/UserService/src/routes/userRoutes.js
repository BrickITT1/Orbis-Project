import express from 'express';

import {  
    getUserInfo, 
    getUsersFriends, 
    getChats, 
    startchat, 
    getUserbyName, 
    friendInvite, 
    rejectFriendInvite, 
    confirmFriendInvite,
    getUsersInviteMe,
    getUserInvite
} from "../controllers/userController.js";

export const userRouter = express.Router();

//userRouter.get("/user/:id", getUserInfo);


userRouter.get("/user/search", getUserbyName);
userRouter.get("/user/:id", getUserInfo);
userRouter.get("/chats/", getChats);
// Начать чат с пользователем
userRouter.post("/user/:id/chatstart", startchat)
userRouter.post("/friend/:id/invite", friendInvite)

userRouter.get("/friend", getUsersFriends);
userRouter.get("/friend/invme", getUsersInviteMe);
userRouter.get("/friend/invi", getUserInvite);
userRouter.post("/friend/:id/confirm", confirmFriendInvite)
userRouter.post("/friend/:id/reject", rejectFriendInvite)
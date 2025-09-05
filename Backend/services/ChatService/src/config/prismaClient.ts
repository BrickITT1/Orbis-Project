import { PrismaClient } from "@prisma/client";

console.log("Creating PrismaClient...");
export const prisma = new PrismaClient();
console.log("PrismaClient created");

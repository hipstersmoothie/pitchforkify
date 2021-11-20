import { PrismaClient } from "@prisma/client";

// const prisma = global.prisma || new PrismaClient();
const prisma = new PrismaClient();

prisma.$connect();

// if (process.env.NODE_ENV === "development") global.prisma = prisma;

export default prisma;

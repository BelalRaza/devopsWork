const { PrismaClient } = require('@prisma/client');

// Create a singleton Prisma client instance
const prisma = new PrismaClient();

module.exports = prisma;

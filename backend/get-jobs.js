const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.job.findMany({ include: { company: true, category: true } })
  .then(jobs => console.log(JSON.stringify(jobs, null, 2)))
  .catch(console.error)
  .finally(() => prisma.$disconnect());

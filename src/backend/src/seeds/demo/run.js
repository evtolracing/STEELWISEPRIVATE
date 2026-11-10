import prisma from '../../lib/db.js';
import { seedDemo } from './index.js';

seedDemo()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma?.$disconnect());

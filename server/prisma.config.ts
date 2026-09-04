// prisma.config.ts
import 'dotenv/config'; // Required to load variables from your .env file
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
});
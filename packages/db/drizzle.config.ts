import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://apex:apex_secret@localhost:5432/apex_v2',
  },
} satisfies Config;

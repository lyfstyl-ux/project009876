
import { config } from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Load environment variables from .env file
// Use override: false to preserve Replit's environment variables
config({ override: false });

// Get DATABASE_URL from environment (provided by Replit)
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Determine if we need SSL based on the connection string
// Replit's local database doesn't require SSL, external databases might
const requiresSsl = databaseUrl.includes('supabase.co') || databaseUrl.includes('neon.tech');

// PostgreSQL connection with pooling
export const pool = new Pool({ 
  connectionString: databaseUrl,
  ...(requiresSsl && {
    ssl: {
      rejectUnauthorized: false
    }
  }),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = drizzle(pool, { schema });

import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL not found. Please add PostgreSQL from the Tools panel or set DATABASE_URL in Secrets.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});

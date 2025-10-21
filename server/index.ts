// ensure environment files are loaded. Load base .env first, then
// allow .env.development to override when running in development.
import dotenv from 'dotenv';
import path from 'path';

// Always load base .env if present so users can keep DATABASE_URL there.
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// If running in development, also load (and allow) .env.development to override values.
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env.development'), override: true });
}

// Database URL should come from Replit Secrets or local .env files.
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found. Make sure Replit PostgreSQL database is provisioned or set DATABASE_URL in .env/.env.development.');
}

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { storage } from "./supabase-storage";
import { createE1XPRouter } from './routes/e1xp';
import { autoMigrateOnStartup } from "./migrate-old-data";
import { setupVite, serveStatic, log } from "./vite";
import { initTelegramBot } from "./telegram-bot";
import { ActivityTrackerCron } from "./activity-tracker-cron";
import { base } from "viem/chains";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Initialize Telegram bot
  await initTelegramBot();

  // Start trending notifications
  const { startTrendingNotifications } = await import('./trending-notifications');
  startTrendingNotifications();

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // Run automatic migration on startup
  try {
    await autoMigrateOnStartup();
  } catch (error) {
    console.error("Failed to run auto migration:", error);
  }

  // Initialize and start activity tracker cron job
  const activityTrackerCron = new ActivityTrackerCron(storage, base.id);
  activityTrackerCron.start();
  log(`Activity tracker cron started with schedule: ${activityTrackerCron.getSchedule()}`);

  // Initialize and start notification cron jobs
  const { notificationCron } = await import('./notification-cron');
  notificationCron.start();
  log(`Notification cron jobs started: ${notificationCron.getSchedules().length} jobs`);

  // Start streak reminder cron service
  const { startStreakReminderCron } = await import('./streak-reminder-cron');
  startStreakReminderCron();
  log(`Streak reminder cron started.`);

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    const { stopTelegramBot } = await import('./telegram-bot');
    await stopTelegramBot();
    activityTrackerCron.stop();
    notificationCron.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
})();
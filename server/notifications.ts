
import { db } from "./db";
import { notifications, users } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  coinAddress?: string;
  coinSymbol?: string;
  amount?: string;
  transactionHash?: string;
}) {
  const [notification] = await db.insert(notifications).values(data).returning();
  return notification;
}

export async function getUserNotifications(userId: string) {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
  });
}

export async function markNotificationAsRead(notificationId: string) {
  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: string) {
  await db.update(notifications)
    .set({ read: true })
    .where(eq(notifications.userId, userId));
}

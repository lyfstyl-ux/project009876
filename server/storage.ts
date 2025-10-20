import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
import {
  coins,
  scrapedContent,
  rewards,
  creators,
  comments,
  follows,
  referrals,
  loginStreaks,
  type Coin,
  type InsertCoin,
  type UpdateCoin,
  type ScrapedContent,
  type InsertScrapedContent,
  type Reward,
  type InsertReward,
  type Creator,
  type InsertCreator,
  type UpdateCreator,
  type Comment,
  type InsertComment,
  type Follow,
  type InsertFollow,
  type Referral,
  type InsertReferral,
  type LoginStreak,
  type InsertLoginStreak,
  type UpdateLoginStreak,
  type Notification,
  type NotificationType,
} from "@shared/schema";

// Type for user notifications with creator info
export interface UserNotification {
  id: string;
  creator_id: string;
  type: string;
  title: string;
  message: string;
  metadata?: any;
  read: boolean;
  created_at: string;
  updated_at: string;
  creator?: {
    address: string;
    name: string | null;
    avatar: string | null;
  };
}

export type ModerationType = 'warn' | 'ban' | 'unban';

export class Storage {
  // ===== COINS =====
  async getAllCoins(): Promise<Coin[]> {
    return await db.select().from(coins).orderBy(desc(coins.createdAt));
  }

  async getCoin(id: string): Promise<Coin | undefined> {
    const result = await db.select().from(coins).where(eq(coins.id, id)).limit(1);
    return result[0];
  }

  async getCoinByAddress(address: string): Promise<Coin | undefined> {
    const result = await db.select().from(coins).where(eq(coins.address, address)).limit(1);
    return result[0];
  }

  async getCoinsByCreator(creator: string): Promise<Coin[]> {
    return await db
      .select()
      .from(coins)
      .where(eq(coins.creator_wallet, creator))
      .orderBy(desc(coins.createdAt));
  }

  async createCoin(insertCoin: InsertCoin): Promise<Coin> {
    const result = await db.insert(coins).values(insertCoin).returning();
    return result[0];
  }

  async updateCoin(id: string, update: UpdateCoin): Promise<Coin | undefined> {
    const result = await db
      .update(coins)
      .set(update)
      .where(eq(coins.id, id))
      .returning();
    return result[0];
  }

  // ===== SCRAPED CONTENT =====
  async getScrapedContent(id: string): Promise<ScrapedContent | undefined> {
    const result = await db
      .select()
      .from(scrapedContent)
      .where(eq(scrapedContent.id, id))
      .limit(1);
    return result[0];
  }

  async createScrapedContent(content: InsertScrapedContent): Promise<ScrapedContent> {
    const result = await db.insert(scrapedContent).values(content).returning();
    return result[0];
  }

  async getAllScrapedContent(): Promise<ScrapedContent[]> {
    return await db.select().from(scrapedContent).orderBy(desc(scrapedContent.scrapedAt));
  }

  // ===== REWARDS =====
  async getReward(id: string): Promise<Reward | undefined> {
    const result = await db.select().from(rewards).where(eq(rewards.id, id)).limit(1);
    return result[0];
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const result = await db.insert(rewards).values(reward).returning();
    return result[0];
  }

  async getAllRewards(): Promise<Reward[]> {
    return await db.select().from(rewards).orderBy(desc(rewards.createdAt));
  }

  async getRewardsByCoin(coinAddress: string): Promise<Reward[]> {
    return await db
      .select()
      .from(rewards)
      .where(eq(rewards.coinAddress, coinAddress))
      .orderBy(desc(rewards.createdAt));
  }

  async getRewardsByRecipient(recipientAddress: string): Promise<Reward[]> {
    return await db
      .select()
      .from(rewards)
      .where(eq(rewards.recipientAddress, recipientAddress))
      .orderBy(desc(rewards.createdAt));
  }

  // ===== CREATORS =====
  async getCreator(id: string): Promise<Creator | undefined> {
    const result = await db.select().from(creators).where(eq(creators.id, id)).limit(1);
    return result[0];
  }

  async getCreatorByAddress(address: string): Promise<Creator | undefined> {
    const result = await db
      .select()
      .from(creators)
      .where(eq(creators.address, address))
      .limit(1);
    return result[0];
  }

  async getCreatorByReferralCode(referralCode: string): Promise<Creator | undefined> {
    const result = await db
      .select()
      .from(creators)
      .where(eq(creators.referralCode, referralCode))
      .limit(1);
    return result[0];
  }

  async createCreator(creator: InsertCreator): Promise<Creator> {
    const result = await db.insert(creators).values(creator).returning();
    return result[0];
  }

  async updateCreator(id: string, update: UpdateCreator): Promise<Creator | undefined> {
    const result = await db
      .update(creators)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(creators.id, id))
      .returning();
    return result[0];
  }

  async addPoints(creatorId: string, amount: number, reason: string): Promise<void> {
    const creator = await this.getCreator(creatorId);
    if (!creator) return;

    const currentPoints = parseInt(creator.points) || 0;
    const newPoints = currentPoints + amount;

    await db
      .update(creators)
      .set({ points: newPoints.toString(), updatedAt: new Date() })
      .where(eq(creators.id, creatorId));
  }

  async getAllCreators(): Promise<Creator[]> {
    return await db.select().from(creators).orderBy(desc(creators.createdAt));
  }

  async getTopCreators(): Promise<Creator[]> {
    return await db.select().from(creators).orderBy(desc(creators.totalVolume)).limit(10);
  }

  async awardPoints(
    creatorId: string,
    amount: number,
    reason: string,
    type: NotificationType
  ): Promise<void> {
    await this.addPoints(creatorId, amount, reason);
  }

  // Stub methods for daily points (not implemented yet - would need additional table)
  async getDailyPoints(creatorId: string): Promise<{ claimed: boolean; streak: number }> {
    return { claimed: false, streak: 0 };
  }

  async claimDailyPoints(creatorId: string): Promise<number> {
    return 0;
  }

  async getDailyPointsStatus(
    creatorId: string
  ): Promise<{ claimed: boolean; streak: number; nextClaimAmount: number }> {
    return { claimed: false, streak: 0, nextClaimAmount: 0 };
  }

  // ===== NOTIFICATIONS (Stub - would need notification table in schema) =====
  async createNotification(notification: {
    creator_id: string;
    type: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<Notification> {
    // This would need a notifications table in the schema
    // For now, return a stub
    return {
      id: crypto.randomUUID(),
      creator_id: notification.creator_id,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      metadata: notification.metadata,
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async getUserNotifications(creatorId: string): Promise<UserNotification[]> {
    return [];
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return [];
  }

  async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    return [];
  }

  async markNotificationAsRead(notificationId: string): Promise<Notification | undefined> {
    return undefined;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    // Stub
  }

  async deleteNotification(id: string): Promise<boolean> {
    return false;
  }

  // ===== MODERATION (Stub - would need moderation table) =====
  async moderateUser(creatorId: string, action: ModerationType): Promise<void> {
    // Stub - would need moderation history table
  }

  async getModerationHistory(creatorId: string): Promise<ModerationType[]> {
    return [];
  }

  // ===== COMMENTS =====
  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async getCommentsByCoin(coinAddress: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.coinAddress, coinAddress))
      .orderBy(desc(comments.createdAt));
  }

  async getAllComments(): Promise<Comment[]> {
    return await db.select().from(comments).orderBy(desc(comments.createdAt));
  }

  // ===== FOLLOWS =====
  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    const result = await db.insert(follows).values(insertFollow).returning();
    return result[0];
  }

  async deleteFollow(followerAddress: string, followingAddress: string): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerAddress, followerAddress),
          eq(follows.followingAddress, followingAddress)
        )
      )
      .returning();
    return result.length > 0;
  }

  async getFollowers(userAddress: string): Promise<Follow[]> {
    return await db
      .select()
      .from(follows)
      .where(eq(follows.followingAddress, userAddress))
      .orderBy(desc(follows.createdAt));
  }

  async getFollowing(userAddress: string): Promise<Follow[]> {
    return await db
      .select()
      .from(follows)
      .where(eq(follows.followerAddress, userAddress))
      .orderBy(desc(follows.createdAt));
  }

  async isFollowing(followerAddress: string, followingAddress: string): Promise<boolean> {
    const result = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerAddress, followerAddress),
          eq(follows.followingAddress, followingAddress)
        )
      )
      .limit(1);
    return result.length > 0;
  }

  // ===== REFERRALS =====
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const result = await db.insert(referrals).values(insertReferral).returning();
    return result[0];
  }

  async getReferralsByReferrer(referrerAddress: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerAddress, referrerAddress))
      .orderBy(desc(referrals.createdAt));
  }

  async getReferralsByCode(referralCode: string): Promise<Referral[]> {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralCode, referralCode))
      .orderBy(desc(referrals.createdAt));
  }

  async getReferralByAddresses(
    referrerAddress: string,
    referredAddress: string
  ): Promise<Referral | undefined> {
    const result = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerAddress, referrerAddress),
          eq(referrals.referredAddress, referredAddress)
        )
      )
      .limit(1);
    return result[0];
  }

  // ===== LOGIN STREAKS =====
  async getLoginStreak(userAddress: string): Promise<LoginStreak | undefined> {
    const result = await db
      .select()
      .from(loginStreaks)
      .where(eq(loginStreaks.userAddress, userAddress))
      .limit(1);
    return result[0];
  }

  async createLoginStreak(insertLoginStreak: InsertLoginStreak): Promise<LoginStreak> {
    const result = await db.insert(loginStreaks).values(insertLoginStreak).returning();
    return result[0];
  }

  async updateLoginStreak(
    userAddress: string,
    update: UpdateLoginStreak
  ): Promise<LoginStreak | undefined> {
    const result = await db
      .update(loginStreaks)
      .set({ ...update, updatedAt: new Date() })
      .where(eq(loginStreaks.userAddress, userAddress))
      .returning();
    return result[0];
  }
}

export const storage = new Storage();


import { db } from "./db";
import { users, pointsTransactions } from "@shared/schema";
import { eq } from "drizzle-orm";

export const POINTS_REWARDS = {
  DAILY_LOGIN: 10,
  DAILY_STREAK_3: 25,
  DAILY_STREAK_7: 50,
  DAILY_STREAK_30: 200,
  TRADE_BUY: 5,
  TRADE_SELL: 5,
  CREATE_COIN: 100,
  IMPORT_COIN: 50,
  REFERRAL_SIGNUP: 500,
  REFERRAL_FIRST_TRADE: 250,
  PROFILE_COMPLETE: 30,
  FIRST_CONNECTION: 20,
  JOIN_GROUP: 15,
};

export const BADGES = {
  NEWCOMER: { name: "Newcomer", threshold: 0, icon: "🌱" },
  EXPLORER: { name: "Explorer", threshold: 100, icon: "🔍" },
  TRADER: { name: "Trader", threshold: 500, icon: "💎" },
  CREATOR: { name: "Creator", threshold: 1000, icon: "🎨" },
  INFLUENCER: { name: "Influencer", threshold: 2500, icon: "⭐" },
  LEGEND: { name: "Legend", threshold: 5000, icon: "👑" },
  STREAK_MASTER: { name: "Streak Master", threshold: -1, special: "7_day_streak", icon: "🔥" },
  REFERRAL_KING: { name: "Referral King", threshold: -1, special: "10_referrals", icon: "🤝" },
};

export async function awardPoints(
  userId: string,
  amount: number,
  type: string,
  description: string,
  metadata?: Record<string, any>
) {
  // Add points transaction
  await db.insert(pointsTransactions).values({
    userId,
    amount,
    type,
    description,
    metadata,
  });

  // Update user's total points
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const newPoints = (user.e1xpPoints || 0) + amount;
  const currentBadges = user.pointsBadges || [];
  const newBadges = [...currentBadges];

  // Check for new badge unlocks
  for (const [key, badge] of Object.entries(BADGES)) {
    const badgeKey = key.toLowerCase();
    if (!currentBadges.includes(badgeKey) && badge.threshold > 0 && newPoints >= badge.threshold) {
      newBadges.push(badgeKey);
      
      // Award bonus points for unlocking badge
      await db.insert(pointsTransactions).values({
        userId,
        amount: 50,
        type: "badge_unlock",
        description: `Unlocked ${badge.name} badge!`,
        metadata: { badge: badgeKey },
      });
    }
  }

  const [updatedUser] = await db
    .update(users)
    .set({
      e1xpPoints: newPoints + (newBadges.length > currentBadges.length ? 50 : 0),
      pointsBadges: newBadges,
    })
    .where(eq(users.id, userId))
    .returning();

  return updatedUser;
}

export async function checkAndAwardSpecialBadges(userId: string, type: string, metadata?: any) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return;

  const currentBadges = user.pointsBadges || [];
  const newBadges = [...currentBadges];

  // Streak Master - 7 day streak
  if (type === "7_day_streak" && !currentBadges.includes("streak_master")) {
    newBadges.push("streak_master");
    await awardPoints(userId, 100, "badge_unlock", "Unlocked Streak Master badge!", { badge: "streak_master" });
  }

  // Referral King - 10 referrals
  if (type === "10_referrals" && !currentBadges.includes("referral_king")) {
    newBadges.push("referral_king");
    await awardPoints(userId, 200, "badge_unlock", "Unlocked Referral King badge!", { badge: "referral_king" });
  }

  if (newBadges.length > currentBadges.length) {
    await db
      .update(users)
      .set({ pointsBadges: newBadges })
      .where(eq(users.id, userId));
  }
}

export async function generateReferralCode(userId: string): Promise<string> {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  await db
    .update(users)
    .set({ referralCode: code })
    .where(eq(users.id, userId));
  return code;
}

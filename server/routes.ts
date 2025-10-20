import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getMockCurrentUserId, getCurrentUserId } from "./mock-auth";
import { insertUserSchema, insertProjectSchema, insertCoinSchema, insertMessageSchema, insertConnectionSchema, insertGroupSchema } from "@shared/schema";
import { db } from "./db";
import * as schema from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { Router } from "express";
import { getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead, createNotification } from "./notifications";

// Privy auth middleware
const privyAuth = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      req.user = null;
      return next();
    }

    // In production, verify the Privy JWT token here
    // For now, we'll extract the user from the token payload
    const token = authHeader.replace('Bearer ', '');
    // TODO: Verify with Privy's public key
    req.user = { id: getMockCurrentUserId() }; // Temporary mock
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  const router = Router();

  // Apply auth middleware to all routes
  router.use(privyAuth);

  // ========== USERS ==========

  // Get current user or user by ID
  router.get("/api/users/:id?", async (req, res) => {
    try {
      // TODO: Replace with Privy authentication - get user from req.session or JWT token
      const userId = req.params.id || getMockCurrentUserId();
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user
  router.patch("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.updateUser(id, req.body);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Search creators
  router.get("/api/creators", async (req, res) => {
    try {
      const { search, category, location, sortBy } = req.query;
      const creators = await storage.searchUsers(search as string || "", {
        category,
        location,
        sortBy,
      });
      res.json(creators);
    } catch (error) {
      console.error("Error searching creators:", error);
      res.status(500).json({ message: "Failed to search creators" });
    }
  });

  // Get trending creators
  router.get("/api/creators/trending", async (req, res) => {
    try {
      const creators = await storage.getTrendingCreators(12);
      res.json(creators);
    } catch (error) {
      console.error("Error fetching trending creators:", error);
      res.status(500).json({ message: "Failed to fetch trending creators" });
    }
  });

  // ========== PROJECTS ==========

  // Get projects by user
  router.get("/api/projects/:userId?", async (req, res) => {
    try {
      // TODO: Replace with Privy authentication
      const userId = req.params.userId || getMockCurrentUserId();
      const projects = await storage.getProjectsByUser(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get featured projects
  router.get("/api/projects/featured", async (req, res) => {
    try {
      const projects = await storage.getFeaturedProjects(8);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching featured projects:", error);
      res.status(500).json({ message: "Failed to fetch featured projects" });
    }
  });

  // Create project
  router.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: "Failed to create project" });
    }
  });

  // Update project
  router.patch("/api/projects/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const project = await storage.updateProject(id, req.body);

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // ========== COINS ==========

  // Get coins by user
  router.get("/api/coins/:userId?", async (req, res) => {
    try {
      // TODO: Replace with Privy authentication
      const userId = req.params.userId || getMockCurrentUserId();
      const coins = await storage.getCoinsByUser(userId);
      res.json(coins);
    } catch (error) {
      console.error("Error fetching coins:", error);
      res.status(500).json({ message: "Failed to fetch coins" });
    }
  });

  // Create/mint coin
  router.post("/api/coins", async (req, res) => {
    try {
      const validatedData = insertCoinSchema.parse(req.body);
      const coin = await storage.createCoin(validatedData);

      // Track referral activity
      if (coin.userId) {
        const { trackReferralActivity } = await import("./points");
        await trackReferralActivity(coin.userId, 'create_coin');
      }

      res.status(201).json(coin);
    } catch (error) {
      console.error("Error creating coin:", error);
      res.status(400).json({ message: "Failed to create coin" });
    }
  });

  // Update coin
  router.patch("/api/coins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const coin = await storage.updateCoin(id, req.body);

      if (!coin) {
        return res.status(404).json({ message: "Coin not found" });
      }

      res.json(coin);
    } catch (error) {
      console.error("Error updating coin:", error);
      res.status(500).json({ message: "Failed to update coin" });
    }
  });

  // ========== MESSAGES ==========

  // Get conversations
  router.get("/api/messages/conversations", async (req, res) => {
    try {
      // TODO: Replace with Privy authentication
      const userId = getMockCurrentUserId();
      const conversations = await storage.getConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get message requests
  router.get("/api/messages/requests", async (req, res) => {
    try {
      // TODO: Implement message requests logic
      res.json([]);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  // Get messages with a user
  router.get("/api/messages/:userId", async (req, res) => {
    try {
      // TODO: Replace with Privy authentication
      const currentUserId = getMockCurrentUserId();
      const { userId } = req.params;
      const messages = await storage.getMessagesBetween(currentUserId, userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send message
  router.post("/api/messages", async (req, res) => {
    try {
      const validatedData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(validatedData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(400).json({ message: "Failed to send message" });
    }
  });

  // Mark message as read
  router.patch("/api/messages/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markMessageAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // ========== CONNECTIONS ==========

  // Get user's connections
  router.get("/api/connections", async (req, res) => {
    try {
      // TODO: Replace with Privy authentication
      const userId = getMockCurrentUserId();
      const connections = await storage.getConnectionsByUser(userId);
      res.json(connections);
    } catch (error) {
      console.error("Error fetching connections:", error);
      res.status(500).json({ message: "Failed to fetch connections" });
    }
  });

  // Get connection invitations/requests
  router.get("/api/connections/invitations", async (req, res) => {
    try {
      // TODO: Replace with Privy authentication
      const userId = getMockCurrentUserId();
      const invitations = await storage.getConnectionRequests(userId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  // Create connection request
  router.post("/api/connections", async (req, res) => {
    try {
      const validatedData = insertConnectionSchema.parse(req.body);
      const connection = await storage.createConnection(validatedData);
      res.status(201).json(connection);
    } catch (error) {
      console.error("Error creating connection:", error);
      res.status(400).json({ message: "Failed to create connection" });
    }
  });

  // Update connection (accept/reject)
  router.patch("/api/connections/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const connection = await storage.updateConnection(id, req.body);

      if (!connection) {
        return res.status(404).json({ message: "Connection not found" });
      }

      res.json(connection);
    } catch (error) {
      console.error("Error updating connection:", error);
      res.status(500).json({ message: "Failed to update connection" });
    }
  });

  // ========== GROUPS ==========

  // Get all groups
  router.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  // Get group by ID
  router.get("/api/groups/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const group = await storage.getGroup(id);

      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }

      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  // Create group
  router.post("/api/groups", async (req, res) => {
    try {
      const validatedData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(validatedData);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(400).json({ message: "Failed to create group" });
    }
  });

  // Join group
  router.post("/api/groups/:id/join", async (req, res) => {
    try {
      const { id } = req.params;
      // TODO: Replace with Privy authentication
      const userId = getMockCurrentUserId();
      const membership = await storage.joinGroup(id, userId);
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(400).json({ message: "Failed to join group" });
    }
  });

  // ========== LOGIN STREAKS ==========

  // Get user's login streak
  router.get("/api/streaks/me", async (req, res) => {
    try {
      // TODO: Replace with Privy authentication
      const userId = getMockCurrentUserId();
      let streak = await storage.getLoginStreak(userId);

      if (!streak) {
        // Create initial streak
        streak = await storage.createLoginStreak({
          userId,
          currentStreak: 0,
          longestStreak: 0,
          totalPoints: 0,
        });
      }

      res.json(streak);
    } catch (error) {
      console.error("Error fetching streak:", error);
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  // Update login streak (check-in)
  router.post("/api/streaks/checkin", async (req, res) => {
    try {
      const userId = req.user?.id || getMockCurrentUserId();
      let streak = await storage.getLoginStreak(userId);
      const { trackReferralActivity, awardPoints, generateReferralCode, POINTS_REWARDS, BADGES, checkAndAwardSpecialBadges } = await import("./points");

      if (!streak) {
        streak = await storage.createLoginStreak({
          userId,
          currentStreak: 1,
          longestStreak: 1,
          totalPoints: 10,
          lastLoginDate: new Date(),
        });
        await awardPoints(userId, POINTS_REWARDS.DAILY_LOGIN, "daily_login", "Daily login bonus!");
      } else {
        const lastLogin = streak.lastLoginDate ? new Date(streak.lastLoginDate) : null;
        const today = new Date();
        const diffDays = lastLogin
          ? Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        let newStreak = streak.currentStreak || 0;
        let pointsAwarded = 0;

        if (diffDays === 1) {
          // Consecutive day
          newStreak += 1;
          pointsAwarded = POINTS_REWARDS.DAILY_LOGIN;

          // Streak bonuses
          if (newStreak === 3) {
            pointsAwarded += POINTS_REWARDS.DAILY_STREAK_3;
            await awardPoints(userId, POINTS_REWARDS.DAILY_STREAK_3, "daily_streak", "3-day streak bonus!");
          } else if (newStreak === 7) {
            pointsAwarded += POINTS_REWARDS.DAILY_STREAK_7;
            await awardPoints(userId, POINTS_REWARDS.DAILY_STREAK_7, "daily_streak", "7-day streak bonus!");
            await checkAndAwardSpecialBadges(userId, "7_day_streak");
          } else if (newStreak === 30) {
            pointsAwarded += POINTS_REWARDS.DAILY_STREAK_30;
            await awardPoints(userId, POINTS_REWARDS.DAILY_STREAK_30, "daily_streak", "30-day streak bonus!");
          }

          await awardPoints(userId, POINTS_REWARDS.DAILY_LOGIN, "daily_login", `Day ${newStreak} login bonus!`);
        } else if (diffDays > 1) {
          // Streak broken
          newStreak = 1;
          pointsAwarded = POINTS_REWARDS.DAILY_LOGIN;
          await awardPoints(userId, POINTS_REWARDS.DAILY_LOGIN, "daily_login", "Daily login bonus!");
        }

        const newLongest = Math.max(newStreak, streak.longestStreak || 0);
        const newPoints = (streak.totalPoints || 0) + pointsAwarded;

        streak = await storage.updateLoginStreak(userId, {
          currentStreak: newStreak,
          longestStreak: newLongest,
          totalPoints: newPoints,
          lastLoginDate: today,
        });
      }

      res.json(streak);
    } catch (error) {
      console.error("Error updating streak:", error);
      res.status(500).json({ message: "Failed to update streak" });
    }
  });

  // ========== UPLOAD / IPFS ==========

  // Upload to IPFS
  router.post("/api/upload", async (req, res) => {
    try {
      // TODO: Implement IPFS upload via Pinata
      // This would handle file uploads and return IPFS hash
      res.json({ ipfsHash: "mock-ipfs-hash", url: "https://ipfs.io/ipfs/mock-hash" });
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      res.status(500).json({ message: "Failed to upload to IPFS" });
    }
  });

  // ========== E1XP POINTS SYSTEM ==========

  const { awardPoints, generateReferralCode, POINTS_REWARDS, BADGES, checkAndAwardSpecialBadges } = await import("./points");

  // Get user's points history
  router.get("/api/points/history", async (req, res) => {
    try {
      const userId = req.user?.id || getMockCurrentUserId();
      const transactions = await db.query.pointsTransactions.findMany({
        where: eq(schema.pointsTransactions.userId, userId),
        orderBy: [desc(schema.pointsTransactions.createdAt)],
        limit: 50,
      });
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching points history:", error);
      res.status(500).json({ message: "Failed to fetch points history" });
    }
  });

  // Get leaderboard
  router.get("/api/points/leaderboard", async (req, res) => {
    try {
      const topUsers = await db.query.users.findMany({
        orderBy: [desc(schema.users.e1xpPoints)],
        limit: 100,
      });
      res.json(topUsers);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Generate or get referral code
  router.post("/api/referral/generate", async (req, res) => {
    try {
      const userId = req.user?.id || getMockCurrentUserId();
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const code = user.referralCode || await generateReferralCode(userId);
      res.json({ referralCode: code });
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });

  // Get referral stats
  router.get("/api/referral/stats", async (req, res) => {
    try {
      const userId = req.user?.id || getMockCurrentUserId();

      const referralList = await db.select().from(schema.referrals)
        .where(eq(schema.referrals.referrerId, userId));

      const totalReferrals = referralList.length;
      const activeReferrals = referralList.filter(r => r.hasTradedOrCreated).length;
      const totalEarned = referralList.reduce((sum, r) => sum + (r.totalPointsEarned || 0), 0);

      res.json({
        totalReferrals,
        activeReferrals,
        totalEarned,
        referrals: referralList,
      });
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  // Track referral signup
  router.post("/api/referral/signup", async (req, res) => {
    try {
      const { referralCode } = req.body;
      const userId = req.user?.id || getMockCurrentUserId();
      const { trackReferralActivity, awardPoints, generateReferralCode, POINTS_REWARDS, BADGES, checkAndAwardSpecialBadges, createNotification } = await import("./points");

      // Find referrer by username (referral code)
      const [referrer] = await db.select().from(schema.users)
        .where(eq(schema.users.username, referralCode)).limit(1);

      if (!referrer || referrer.id === userId) {
        return res.status(400).json({ message: "Invalid referral code" });
      }

      // Check if already referred
      const [existingReferral] = await db.select().from(schema.referrals)
        .where(eq(schema.referrals.referredUserId, userId)).limit(1);

      if (existingReferral) {
        return res.status(400).json({ message: "Already referred by someone" });
      }

      // Update new user's referredBy
      await db.update(schema.users)
        .set({ referredBy: referrer.id })
        .where(eq(schema.users.id, userId));

      // Create referral tracking record
      await db.insert(schema.referrals).values({
        referrerId: referrer.id,
        referredUserId: userId,
        status: 'pending',
      });

      // Award points to referrer
      await awardPoints(referrer.id, POINTS_REWARDS.REFERRAL_SIGNUP, "referral", "New referral signup!", { referredUserId: userId });

      // Award welcome bonus to new user
      await awardPoints(userId, 100, "referral", "Welcome bonus from referral!");

      // Notify referrer
      await createNotification({
        userId: referrer.id,
        type: "referral_signup",
        title: "New Referral! 🎊",
        message: `Someone joined using your referral code! You earned ${POINTS_REWARDS.REFERRAL_SIGNUP} E1XP`,
        amount: POINTS_REWARDS.REFERRAL_SIGNUP.toString(),
      });

      // Check for referral king badge (10 referrals)
      const referralCount = await db.select({ count: sql<number>`count(*)` })
        .from(schema.referrals)
        .where(eq(schema.referrals.referrerId, referrer.id));

      if (referralCount[0]?.count === 10) {
        await checkAndAwardSpecialBadges(referrer.id, "10_referrals");
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error processing referral:", error);
      res.status(500).json({ message: "Failed to process referral" });
    }
  });

  // ========== SHARE TRACKING ==========

  const { generateProfileOGMeta, generateCoinOGMeta, generateProjectOGMeta, generateReferralOGMeta, generateBadgeOGMeta } = await import("./og-meta");

  // Track share
  router.post("/api/share/track", async (req, res) => {
    try {
      const userId = req.user?.id || getMockCurrentUserId();
      const { shareType, resourceId, platform } = req.body;

      await db.insert(schema.shareTracking).values({
        userId,
        shareType,
        resourceId,
        platform,
      });

      // Award points for sharing
      await awardPoints(userId, 5, "share", `Shared ${shareType}`, { platform });

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking share:", error);
      res.status(500).json({ message: "Failed to track share" });
    }
  });

  // Get OG meta for resource
  router.get("/api/og-meta/:type/:id", async (req, res) => {
    try {
      const { type, id } = req.params;
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      let meta;
      switch (type) {
        case "profile": {
          const user = await storage.getUser(id);
          if (!user) return res.status(404).json({ message: "User not found" });
          meta = generateProfileOGMeta(user, baseUrl);
          break;
        }
        case "coin": {
          const coin = await storage.getCoin(id);
          if (!coin) return res.status(404).json({ message: "Coin not found" });
          meta = generateCoinOGMeta(coin, baseUrl);
          break;
        }
        case "project": {
          const project = await storage.getProject(id);
          if (!project) return res.status(404).json({ message: "Project not found" });
          meta = generateProjectOGMeta(project, baseUrl);
          break;
        }
        default:
          return res.status(400).json({ message: "Invalid type" });
      }

      res.json(meta);
    } catch (error) {
      console.error("Error generating OG meta:", error);
      res.status(500).json({ message: "Failed to generate OG meta" });
    }
  });

  // Notification routes
  router.get("/api/notifications", async (req, res) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const notifications = await getUserNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  router.post("/api/notifications/:id/read", async (req, res) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  router.post("/api/notifications/read-all", async (req, res) => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  // Admin routes
  router.get("/api/admin/stats", async (req, res) => {
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(schema.users);
    const totalCoins = await db.select({ count: sql<number>`count(*)` }).from(schema.coins);
    const pendingCoins = await db.select({ count: sql<number>`count(*)` })
      .from(schema.coins)
      .where(eq(schema.coins.status, 'pending'));
    const totalNotifications = await db.select({ count: sql<number>`count(*)` }).from(schema.notifications);

    res.json({
      totalUsers: totalUsers[0]?.count || 0,
      totalCoins: totalCoins[0]?.count || 0,
      pendingCoins: pendingCoins[0]?.count || 0,
      totalNotifications: totalNotifications[0]?.count || 0,
    });
  });

  router.get("/api/admin/users", async (req, res) => {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(schema.users.createdAt)],
      limit: 100,
    });
    res.json(allUsers);
  });

  router.get("/api/admin/coins", async (req, res) => {
    const allCoins = await db.query.coins.findMany({
      orderBy: [desc(schema.coins.createdAt)],
      limit: 100,
    });
    res.json(allCoins);
  });

  router.get("/api/admin/notifications", async (req, res) => {
    const allNotifications = await db.query.notifications.findMany({
      orderBy: [desc(schema.notifications.createdAt)],
      limit: 100,
    });
    res.json(allNotifications);
  });

  app.use(router);

  const httpServer = createServer(app);

  return httpServer;
}
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - integrates with Privy authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  privyId: text("privy_id").unique(),
  walletAddress: text("wallet_address"),
  email: text("email"),
  username: text("username").notNull().unique(),
  displayName: text("display_name"),
  bio: text("bio"),
  location: text("location"),
  avatarUrl: text("avatar_url"),
  coverImageUrl: text("cover_image_url"),
  socialAccounts: jsonb("social_accounts").$type<{
    instagram?: string;
    tiktok?: string;
    youtube?: string;
    twitter?: string;
  }>(),
  creatorType: text("creator_type"), // 'content_creator' | 'public_goods_builder'
  audienceAge: text("audience_age"), // '18-24' | '25-34' etc
  categories: text("categories").array(), // ['Music', 'Art', 'Tech', etc]
  totalConnections: integer("total_connections").default(0),
  totalProfileViews: integer("total_profile_views").default(0),
  totalEarnings: decimal("total_earnings", { precision: 18, scale: 8 }).default("0"),
  e1xpPoints: integer("e1xp_points").default(0),
  pointsBadges: jsonb("points_badges").$type<string[]>().default([]),
  referralCode: text("referral_code").unique(),
  referredBy: varchar("referred_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Projects table - content/campaigns that can be minted as coins
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sourceUrl: text("source_url"), // URL of original content
  thumbnailUrl: text("thumbnail_url"),
  ipfsHash: text("ipfs_hash"), // IPFS storage hash
  category: text("category"),
  totalViews: integer("total_views").default(0),
  totalInteractions: integer("total_interactions").default(0),
  isMinted: boolean("is_minted").default(false),
  coinId: varchar("coin_id"), // Reference to minted coin if exists
  createdAt: timestamp("created_at").defaultNow(),
});

// Coins table - from Supabase schema (tokenized assets)
export const coins = pgTable("coins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  address: text("address"),
  userId: varchar("user_id").references(() => users.id),
  creatorWallet: text("creator_wallet").notNull(),
  status: text("status").notNull().default("pending"),
  scrapedContentId: varchar("scraped_content_id").references(() => scrapedContent.id),
  ipfsUri: text("ipfs_uri"),
  chainId: text("chain_id"),
  registryTxHash: text("registry_tx_hash"),
  metadataHash: text("metadata_hash"),
  registeredAt: timestamp("registered_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  image: text("image"),
  description: text("description"),
});

// Transactions table - trading history
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coinId: varchar("coin_id").references(() => coins.id).notNull(),
  buyerId: varchar("buyer_id").references(() => users.id),
  sellerId: varchar("seller_id").references(() => users.id),
  transactionType: text("transaction_type").notNull(), // 'buy' | 'sell' | 'mint'
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  totalValue: decimal("total_value", { precision: 18, scale: 8 }).notNull(),
  txHash: text("tx_hash"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").references(() => users.id).notNull(),
  recipientId: varchar("recipient_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").default("text"), // 'text' | 'invitation' | 'request'
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Connections table - creator relationships
export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  connectedUserId: varchar("connected_user_id").references(() => users.id).notNull(),
  status: text("status").default("pending"), // 'pending' | 'connected' | 'rejected'
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  totalInteractions: integer("total_interactions").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Groups table - creator communities
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  coverImageUrl: text("cover_image_url"),
  category: text("category"),
  memberCount: integer("member_count").default(0),
  isPrivate: boolean("is_private").default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group memberships
export const groupMemberships = pgTable("group_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").references(() => groups.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  role: text("role").default("member"), // 'admin' | 'member'
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Login streaks for gamification
export const loginStreaks = pgTable("login_streaks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  totalPoints: integer("total_points").default(0),
  lastLoginDate: timestamp("last_login_date"),
  weeklyCalendar: jsonb("weekly_calendar").$type<boolean[]>().default([false, false, false, false, false, false, false]),
});

// Bookmarks
export const bookmarks = pgTable("bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  projectId: varchar("project_id").references(() => projects.id),
  coinId: varchar("coin_id").references(() => coins.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// E1XP Points Transactions
export const pointsTransactions = pgTable("points_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // 'daily_streak' | 'trade' | 'create_coin' | 'referral' | 'badge_unlock'
  description: text("description").notNull(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// OG Meta Share Tracking
export const shareTracking = pgTable("share_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  shareType: text("share_type").notNull(), // 'profile' | 'coin' | 'project' | 'referral' | 'badge'
  resourceId: text("resource_id"),
  platform: text("platform"), // 'twitter' | 'telegram' | 'facebook' | 'copy_link'
  views: integer("views").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  projects: many(projects),
  coins: many(coins),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  connections: many(connections),
  groupMemberships: many(groupMemberships),
  loginStreak: many(loginStreaks),
  pointsTransactions: many(pointsTransactions),
  shareTracking: many(shareTracking),
  referrer: one(users, {
    fields: [users.referredBy],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  coin: one(coins, {
    fields: [projects.coinId],
    references: [coins.id],
  }),
}));

export const coinsRelations = relations(coins, ({ one, many }) => ({
  user: one(users, {
    fields: [coins.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
  scrapedContent: one(scrapedContent, {
    fields: [coins.scraped_content_id],
    relationName: "coinContent",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  user: one(users, {
    fields: [connections.userId],
    references: [users.id],
  }),
  connectedUser: one(users, {
    fields: [connections.connectedUserId],
    references: [users.id],
  }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  memberships: many(groupMemberships),
}));

export const groupMembershipsRelations = relations(groupMemberships, ({ one }) => ({
  group: one(groups, {
    fields: [groupMemberships.groupId],
    references: [groups.id],
  }),
  user: one(users, {
    fields: [groupMemberships.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  totalConnections: true,
  totalProfileViews: true,
  totalEarnings: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  totalViews: true,
  totalInteractions: true,
  isMinted: true,
});

export const insertCoinSchema = createInsertSchema(coins, {
  name: z.string().min(1, "Coin name is required"),
  symbol: z.string().min(1, "Symbol is required"),
  status: z.enum(["pending", "active", "minted"]).default("pending"),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
  totalInteractions: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  memberCount: true,
});

export const insertGroupMembershipSchema = createInsertSchema(groupMemberships).omit({
  id: true,
  joinedAt: true,
});

export const insertLoginStreakSchema = createInsertSchema(loginStreaks).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Coin = typeof coins.$inferSelect;
export type InsertCoin = z.infer<typeof insertCoinSchema>;

export type Transaction = typeof transactions.$inferSelect;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;

export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

export type GroupMembership = typeof groupMemberships.$inferSelect;
export type InsertGroupMembership = z.infer<typeof insertGroupMembershipSchema>;

export type LoginStreak = typeof loginStreaks.$inferSelect;
export type InsertLoginStreak = z.infer<typeof insertLoginStreakSchema>;

export type Bookmark = typeof bookmarks.$inferSelect;

export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type InsertPointsTransaction = typeof pointsTransactions.$inferInsert;

export type ShareTracking = typeof shareTracking.$inferSelect;
export type InsertShareTracking = typeof shareTracking.$inferInsert;

// Scraped Content table - imported content from URLs
export const scrapedContent = pgTable("scraped_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  platform: text("platform").notNull().default("blog"),
  title: text("title").notNull(),
  description: text("description"),
  author: text("author"),
  publishDate: text("publish_date"),
  image: text("image"),
  content: text("content"),
  tags: jsonb("tags").$type<string[]>(),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
});

// Rewards table for tracking creator earnings
export const rewards = pgTable("rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  coinAddress: text("coin_address").notNull(),
  coinSymbol: text("coin_symbol").notNull(),
  transactionHash: text("transaction_hash").notNull(),
  rewardAmount: text("reward_amount").notNull(),
  rewardCurrency: text("reward_currency").notNull().default("ZORA"),
  recipientAddress: text("recipient_address").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  coinAddress: text("coin_address"),
  coinSymbol: text("coin_symbol"),
  amount: text("amount"),
  transactionHash: text("transaction_hash"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Creators table
export const creators = pgTable("creators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  address: text("address").notNull().unique(),
  name: text("name"),
  bio: text("bio"),
  avatar: text("avatar"),
  profileImage: text("profileImage"),
  verified: text("verified").notNull().default("false"),
  totalCoins: text("total_coins").notNull().default("0"),
  totalVolume: text("total_volume").notNull().default("0"),
  followers: text("followers").notNull().default("0"),
  referralCode: text("referral_code"),
  points: text("points").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  coinAddress: text("coin_address").notNull(),
  userAddress: text("user_address").notNull(),
  comment: text("comment").notNull(),
  transactionHash: text("transaction_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Type exports for new tables
export type ScrapedContent = typeof scrapedContent.$inferSelect;
export type Coin = typeof coins.$inferSelect;
export type Reward = typeof rewards.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Creator = typeof creators.$inferSelect;
export type Comment = typeof comments.$inferSelect;

export const insertScrapedContentSchema = createInsertSchema(scrapedContent).omit({
  id: true,
  scrapedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  read: true,
});

export const insertCreatorSchema = createInsertSchema(creators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertScrapedContent = z.infer<typeof insertScrapedContentSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertCreator = z.infer<typeof insertCreatorSchema>;
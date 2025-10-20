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

// Coins table - minted creator tokens via Zora
export const coins = pgTable("coins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  projectId: varchar("project_id").references(() => projects.id),
  contractAddress: text("contract_address").notNull(),
  tokenId: text("token_id"),
  chainId: integer("chain_id").default(8453), // Base mainnet
  name: text("name").notNull(),
  symbol: text("symbol"),
  totalSupply: decimal("total_supply", { precision: 18, scale: 8 }),
  currentPrice: decimal("current_price", { precision: 18, scale: 8 }),
  marketCap: decimal("market_cap", { precision: 18, scale: 8 }),
  volume24h: decimal("volume_24h", { precision: 18, scale: 8 }),
  priceChange24h: decimal("price_change_24h", { precision: 10, scale: 2 }),
  creatorEarnings: decimal("creator_earnings", { precision: 18, scale: 8 }).default("0"),
  platformFees: decimal("platform_fees", { precision: 18, scale: 8 }).default("0"),
  metadata: jsonb("metadata").$type<{
    description?: string;
    image?: string;
    external_url?: string;
  }>(),
  mintedAt: timestamp("minted_at").defaultNow(),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  coins: many(coins),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" }),
  connections: many(connections),
  groupMemberships: many(groupMemberships),
  loginStreak: many(loginStreaks),
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

export const insertCoinSchema = createInsertSchema(coins).omit({
  id: true,
  mintedAt: true,
  creatorEarnings: true,
  platformFees: true,
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

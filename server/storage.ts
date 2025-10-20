// Referenced from javascript_database blueprint integration
import {
  users,
  projects,
  coins,
  messages,
  connections,
  groups,
  groupMemberships,
  loginStreaks,
  bookmarks,
  type User,
  type InsertUser,
  type Project,
  type InsertProject,
  type Coin,
  type InsertCoin,
  type Message,
  type InsertMessage,
  type Connection,
  type InsertConnection,
  type Group,
  type InsertGroup,
  type GroupMembership,
  type InsertGroupMembership,
  type LoginStreak,
  type InsertLoginStreak,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByPrivyId(privyId: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  searchUsers(query: string, filters?: any): Promise<User[]>;
  getTrendingCreators(limit?: number): Promise<User[]>;

  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUser(userId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<Project>): Promise<Project | undefined>;
  getFeaturedProjects(limit?: number): Promise<Project[]>;

  // Coins
  getCoin(id: string): Promise<Coin | undefined>;
  getCoinsByUser(userId: string): Promise<Coin[]>;
  createCoin(coin: InsertCoin): Promise<Coin>;
  updateCoin(id: string, coin: Partial<Coin>): Promise<Coin | undefined>;

  // Messages
  getMessage(id: string): Promise<Message | undefined>;
  getConversations(userId: string): Promise<any[]>;
  getMessagesBetween(userId1: string, userId2: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<void>;

  // Connections
  getConnection(id: string): Promise<Connection | undefined>;
  getConnectionsByUser(userId: string): Promise<Connection[]>;
  createConnection(connection: InsertConnection): Promise<Connection>;
  updateConnection(id: string, connection: Partial<Connection>): Promise<Connection | undefined>;
  getConnectionRequests(userId: string): Promise<Connection[]>;

  // Groups
  getGroup(id: string): Promise<Group | undefined>;
  getGroups(): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: string, group: Partial<Group>): Promise<Group | undefined>;
  joinGroup(groupId: string, userId: string): Promise<GroupMembership>;

  // Login Streaks
  getLoginStreak(userId: string): Promise<LoginStreak | undefined>;
  updateLoginStreak(userId: string, streak: Partial<LoginStreak>): Promise<LoginStreak | undefined>;
  createLoginStreak(streak: InsertLoginStreak): Promise<LoginStreak>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByPrivyId(privyId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.privyId, privyId));
    return user || undefined;
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.walletAddress, walletAddress));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updateData: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async searchUsers(query: string, filters?: any): Promise<User[]> {
    if (query) {
      return await db.select().from(users).where(
        or(
          like(users.username, `%${query}%`),
          like(users.displayName, `%${query}%`),
          like(users.bio, `%${query}%`)
        )
      ).limit(50);
    }
    
    return await db.select().from(users).limit(50);
  }

  async getTrendingCreators(limit: number = 12): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.totalConnections))
      .limit(limit);
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByUser(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: string, updateData: Partial<Project>): Promise<Project | undefined> {
    const [project] = await db.update(projects).set(updateData).where(eq(projects.id, id)).returning();
    return project || undefined;
  }

  async getFeaturedProjects(limit: number = 8): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .orderBy(desc(projects.totalViews))
      .limit(limit);
  }

  // Coins
  async getCoin(id: string): Promise<Coin | undefined> {
    const [coin] = await db.select().from(coins).where(eq(coins.id, id));
    return coin || undefined;
  }

  async getCoinsByUser(userId: string): Promise<Coin[]> {
    return await db.select().from(coins).where(eq(coins.userId, userId)).orderBy(desc(coins.createdAt));
  }

  async createCoin(insertCoin: InsertCoin): Promise<Coin> {
    const [coin] = await db.insert(coins).values(insertCoin).returning();
    return coin;
  }

  async updateCoin(id: string, updateData: Partial<Coin>): Promise<Coin | undefined> {
    const [coin] = await db.update(coins).set(updateData).where(eq(coins.id, id)).returning();
    return coin || undefined;
  }

  // Messages
  async getMessage(id: string): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message || undefined;
  }

  async getConversations(userId: string): Promise<any[]> {
    // Get unique conversations with last message
    const conversations = await db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.recipientId, userId)
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(50);

    return conversations;
  }

  async getMessagesBetween(userId1: string, userId2: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, userId1), eq(messages.recipientId, userId2)),
          and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
        )
      )
      .orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async markMessageAsRead(id: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }

  // Connections
  async getConnection(id: string): Promise<Connection | undefined> {
    const [connection] = await db.select().from(connections).where(eq(connections.id, id));
    return connection || undefined;
  }

  async getConnectionsByUser(userId: string): Promise<Connection[]> {
    return await db
      .select()
      .from(connections)
      .where(
        and(
          or(eq(connections.userId, userId), eq(connections.connectedUserId, userId)),
          eq(connections.status, "connected")
        )
      );
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const [connection] = await db.insert(connections).values(insertConnection).returning();
    return connection;
  }

  async updateConnection(id: string, updateData: Partial<Connection>): Promise<Connection | undefined> {
    const [connection] = await db.update(connections).set(updateData).where(eq(connections.id, id)).returning();
    return connection || undefined;
  }

  async getConnectionRequests(userId: string): Promise<Connection[]> {
    return await db
      .select()
      .from(connections)
      .where(
        and(
          eq(connections.connectedUserId, userId),
          eq(connections.status, "pending")
        )
      );
  }

  // Groups
  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group || undefined;
  }

  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups).orderBy(desc(groups.memberCount)).limit(50);
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const [group] = await db.insert(groups).values(insertGroup).returning();
    return group;
  }

  async updateGroup(id: string, updateData: Partial<Group>): Promise<Group | undefined> {
    const [group] = await db.update(groups).set(updateData).where(eq(groups.id, id)).returning();
    return group || undefined;
  }

  async joinGroup(groupId: string, userId: string): Promise<GroupMembership> {
    const [membership] = await db
      .insert(groupMemberships)
      .values({ groupId, userId, role: "member" })
      .returning();

    // Update member count
    await db
      .update(groups)
      .set({ memberCount: sql`${groups.memberCount} + 1` })
      .where(eq(groups.id, groupId));

    return membership;
  }

  // Login Streaks
  async getLoginStreak(userId: string): Promise<LoginStreak | undefined> {
    const [streak] = await db.select().from(loginStreaks).where(eq(loginStreaks.userId, userId));
    return streak || undefined;
  }

  async updateLoginStreak(userId: string, updateData: Partial<LoginStreak>): Promise<LoginStreak | undefined> {
    const [streak] = await db.update(loginStreaks).set(updateData).where(eq(loginStreaks.userId, userId)).returning();
    return streak || undefined;
  }

  async createLoginStreak(insertStreak: InsertLoginStreak): Promise<LoginStreak> {
    const result = await db.insert(loginStreaks).values(insertStreak).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();

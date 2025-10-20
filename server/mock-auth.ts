// Mock authentication middleware
// TODO: Replace with Privy authentication integration
// For now, using a seeded user as the mock current user

import { storage } from "./storage";

let mockCurrentUserId: string | null = null;

export async function initMockAuth() {
  // Get the first user from the database as our mock current user
  const users = await storage.getTrendingCreators(1);
  if (users.length > 0) {
    mockCurrentUserId = users[0].id;
    console.log(`🔐 Mock auth initialized with user: ${users[0].username} (${mockCurrentUserId})`);
  }
}

export function getMockCurrentUserId(): string {
  if (!mockCurrentUserId) {
    throw new Error("Mock auth not initialized");
  }
  return mockCurrentUserId;
}

export function setMockCurrentUserId(userId: string) {
  mockCurrentUserId = userId;
}

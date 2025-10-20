
import { createClient } from '@supabase/supabase-js';
import { 
  type Coin, type InsertCoin, type UpdateCoin,
  type ScrapedContent, type InsertScrapedContent,
  type Reward, type InsertReward,
  type Creator, type InsertCreator, type UpdateCreator,
  type Comment, type InsertComment,
  type Notification, type InsertNotification,
  type Follow, type InsertFollow,
  type Referral, type InsertReferral,
  type LoginStreak, type InsertLoginStreak, type UpdateLoginStreak,
  type NotificationType
} from '@shared/schema';

// Initialize Supabase client with service role key for full database access
console.log('Loading Supabase configuration...');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgwhbdlejogerdghkxac.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhnd2hiZGxlam9nZXJkZ2hreGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDc1MzI4NiwiZXhwIjoyMDc2MzI5Mjg2fQ.pTy3zUBuCUqZJd-tC4VXu-HYCO1SfrObTGh2eXHYY3g';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment configuration error:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'set' : 'missing');
  throw new Error('Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Type definitions for notifications
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

export interface NotificationMetadata {
  points?: number;
  reason?: string;
  totalPoints?: number;
  shareText?: string;
  streakDays?: number;
  [key: string]: any;
}

export interface ModerationType {
  type: 'warning' | 'restrict' | 'ban';
  reason: string;
  duration?: number;
}

export class SupabaseStorage {
  // ===== COINS =====
  async getAllCoins(): Promise<Coin[]> {
    const { data, error } = await supabase
      .from('coins')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Coin[];
  }

  async getCoin(id: string): Promise<Coin | undefined> {
    const { data, error } = await supabase
      .from('coins')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Coin | undefined;
  }

  async getCoinByAddress(address: string): Promise<Coin | undefined> {
    const { data, error } = await supabase
      .from('coins')
      .select('*')
      .eq('address', address)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Coin | undefined;
  }

  async getCoinsByCreator(creator: string): Promise<Coin[]> {
    const { data, error } = await supabase
      .from('coins')
      .select('*')
      .eq('creator_wallet', creator)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Coin[];
  }

  async createCoin(insertCoin: InsertCoin): Promise<Coin> {
    const { data, error } = await supabase
      .from('coins')
      .insert({
        name: insertCoin.name,
        symbol: insertCoin.symbol,
        address: insertCoin.address,
        creator_wallet: insertCoin.creator_wallet,
        status: insertCoin.status || 'pending',
        scraped_content_id: insertCoin.scrapedContentId,
        ipfs_uri: insertCoin.ipfsUri,
        chain_id: insertCoin.chainId,
        registry_tx_hash: insertCoin.registryTxHash,
        metadata_hash: insertCoin.metadataHash,
        registered_at: insertCoin.registeredAt,
        image: insertCoin.image,
        description: insertCoin.description,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as Coin;
  }

  async updateCoin(id: string, update: UpdateCoin): Promise<Coin | undefined> {
    const updateData: any = {};
    
    if (update.address !== undefined) updateData.address = update.address;
    if (update.status !== undefined) updateData.status = update.status;
    if (update.registryTxHash !== undefined) updateData.registry_tx_hash = update.registryTxHash;
    if (update.metadataHash !== undefined) updateData.metadata_hash = update.metadataHash;
    if (update.registeredAt !== undefined) updateData.registered_at = update.registeredAt;
    if (update.activityTrackerTxHash !== undefined) updateData.activity_tracker_tx_hash = update.activityTrackerTxHash;
    if (update.activityTrackerRecordedAt !== undefined) updateData.activity_tracker_recorded_at = update.activityTrackerRecordedAt;
    if (update.createdAt !== undefined) updateData.created_at = update.createdAt;

    const { data, error } = await supabase
      .from('coins')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Coin;
  }

  // ===== SCRAPED CONTENT =====
  async getScrapedContent(id: string): Promise<ScrapedContent | undefined> {
    const { data, error } = await supabase
      .from('scraped_content')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as ScrapedContent | undefined;
  }

  async createScrapedContent(content: InsertScrapedContent): Promise<ScrapedContent> {
    const { data, error } = await supabase
      .from('scraped_content')
      .insert({
        url: content.url,
        platform: content.platform || 'blog',
        title: content.title,
        description: content.description,
        author: content.author,
        publish_date: content.publishDate,
        image: content.image,
        content: content.content,
        tags: content.tags || [],
        metadata: content.metadata || {},
        scraped_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as ScrapedContent;
  }

  async getAllScrapedContent(): Promise<ScrapedContent[]> {
    const { data, error } = await supabase
      .from('scraped_content')
      .select('*')
      .order('scraped_at', { ascending: false });

    if (error) throw error;
    return data as ScrapedContent[];
  }

  // ===== REWARDS =====
  async getReward(id: string): Promise<Reward | undefined> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Reward | undefined;
  }

  async createReward(reward: InsertReward): Promise<Reward> {
    const { data, error } = await supabase
      .from('rewards')
      .insert({
        type: reward.type,
        coin_address: reward.coinAddress,
        coin_symbol: reward.coinSymbol,
        transaction_hash: reward.transactionHash,
        reward_amount: reward.rewardAmount,
        reward_currency: reward.rewardCurrency || 'ZORA',
        recipient_address: reward.recipientAddress,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as Reward;
  }

  async getAllRewards(): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Reward[];
  }

  async getRewardsByCoin(coinAddress: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('coin_address', coinAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Reward[];
  }

  async getRewardsByRecipient(recipientAddress: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('recipient_address', recipientAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Reward[];
  }

  // ===== CREATORS =====
  async getCreator(id: string): Promise<Creator | undefined> {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Creator | undefined;
  }

  async getCreatorByAddress(address: string): Promise<Creator | undefined> {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('address', address)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Creator | undefined;
  }

  async getCreatorByReferralCode(referralCode: string): Promise<Creator | undefined> {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .eq('referral_code', referralCode)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Creator | undefined;
  }

  async createCreator(creator: InsertCreator): Promise<Creator> {
    const { data, error } = await supabase
      .from('creators')
      .insert({
        address: creator.address,
        name: creator.name,
        bio: creator.bio,
        avatar: creator.avatar,
        verified: creator.verified || 'false',
        total_coins: creator.totalCoins || '0',
        total_volume: creator.totalVolume || '0',
        followers: creator.followers || '0',
        referral_code: creator.referralCode || null,
        points: creator.points || '0',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as Creator;
  }

  async updateCreator(id: string, update: UpdateCreator): Promise<Creator | undefined> {
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (update.name !== undefined) updates.name = update.name;
    if (update.bio !== undefined) updates.bio = update.bio;
    if (update.avatar !== undefined) updates.avatar = update.avatar;
    if (update.verified !== undefined) updates.verified = update.verified;
    if (update.totalCoins !== undefined) updates.total_coins = update.totalCoins;
    if (update.totalVolume !== undefined) updates.total_volume = update.totalVolume;
    if (update.followers !== undefined) updates.followers = update.followers;
    if (update.referralCode !== undefined) updates.referral_code = update.referralCode;
    if (update.points !== undefined) updates.points = update.points;

    const { data, error } = await supabase
      .from('creators')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Creator;
  }

  async getAllCreators(): Promise<Creator[]> {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Creator[];
  }

  async getTopCreators(): Promise<Creator[]> {
    const { data, error } = await supabase
      .from('creators')
      .select('*')
      .order('total_coins', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as Creator[];
  }

  // Points System Methods
  async addPoints(creatorId: string, amount: number, reason: string): Promise<void> {
    const creator = await this.getCreator(creatorId);
    if (!creator) throw new Error('Creator not found');

    const currentPoints = parseInt(creator.points || '0');
    const newPoints = currentPoints + amount;

    await this.updateCreator(creatorId, { points: newPoints.toString() });
  }

  async awardPoints(creatorId: string, amount: number, reason: string, type: NotificationType): Promise<void> {
    await this.addPoints(creatorId, amount, reason);
    
    const creator = await this.getCreator(creatorId);
    if (!creator) return;

    const newPoints = parseInt(creator.points || '0');

    // Use notification service
    const { notificationService } = await import('./notification-service');
    await notificationService.notifyE1XPEarned(creatorId, amount, reason);

    await this.createNotification({
      creator_id: creatorId,
      type,
      title: '⚡ E1XP Points Earned!',
      message: `You earned ${amount} E1XP points for ${reason}`,
      metadata: {
        points: amount,
        reason,
        totalPoints: newPoints,
        shareText: `I just earned ${amount} E1XP points on @Every1Fun for ${reason}! Total: ${newPoints} ⚡\n\nJoin me: https://every1.fun/profile/${creatorId}\n\n#Every1Fun #E1XP #Web3`
      },
      read: false
    });
  }

  async getDailyPointsStatus(creatorId: string): Promise<{ claimed: boolean; streak: number; nextClaimAmount: number }> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: claimData, error: claimError } = await supabase
      .from('daily_points')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('date', today)
      .single();

    if (claimError && claimError.code !== 'PGRST116') throw claimError;

    const { data: streakData, error: streakError } = await supabase
      .from('daily_points')
      .select('date')
      .eq('creator_id', creatorId)
      .order('date', { ascending: false });

    if (streakError) throw streakError;

    let streak = 0;
    if (streakData && streakData.length > 0) {
      const dates = streakData.map(d => new Date(d.date));
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (dates[0].toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
        for (let i = 0; i < dates.length; i++) {
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - (i + 1));
          if (dates[i].toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
            streak++;
          } else break;
        }
      }
    }

    const basePoints = 10;
    const streakBonus = Math.floor(streak / 7) * 5;
    const nextClaimAmount = basePoints + streakBonus;

    return {
      claimed: !!claimData,
      streak,
      nextClaimAmount
    };
  }

  async claimDailyPoints(creatorId: string): Promise<number> {
    const { claimed, streak, nextClaimAmount } = await this.getDailyPointsStatus(creatorId);
    if (claimed) throw new Error('Daily points already claimed');

    const today = new Date().toISOString().split('T')[0];
    
    const { error } = await supabase
      .from('daily_points')
      .insert({
        creator_id: creatorId,
        date: today,
        points: nextClaimAmount
      });

    if (error) throw error;

    await this.awardPoints(
      creatorId,
      nextClaimAmount,
      `daily login (${streak + 1} day streak)`,
      'points_earned'
    );

    if ((streak + 1) % 7 === 0) {
      await this.createNotification({
        creator_id: creatorId,
        type: 'streak_milestone',
        title: '🎉 Weekly Streak Achievement!',
        message: `Congratulations! You've maintained a ${streak + 1} day streak! Keep it up for more bonus points!`,
        metadata: {
          streakDays: streak + 1,
          shareText: `I just hit a ${streak + 1} day streak on @Every1Fun! 🔥 Earning more E1XP points every day!\n\n#Every1Fun #E1XP #Web3`
        },
        read: false
      });
    }

    return nextClaimAmount;
  }

  // Notification Methods
  async createNotification(notification: {
    creator_id: string;
    type: NotificationType;
    title: string;
    message: string;
    metadata?: NotificationMetadata;
    read: boolean;
  }): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        creator_id: notification.creator_id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        metadata: notification.metadata || {},
        read: notification.read,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async getUserNotifications(creatorId: string): Promise<UserNotification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as UserNotification[];
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  }

  async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notification[];
  }

  async markNotificationAsRead(id: string): Promise<Notification | undefined> {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Notification | undefined;
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // Moderation Methods
  async moderateUser(creatorId: string, action: ModerationType): Promise<void> {
    const now = new Date();
    const expiresAt = action.duration 
      ? new Date(now.getTime() + action.duration * 24 * 60 * 60 * 1000)
      : null;

    const { error: moderationError } = await supabase
      .from('moderation_actions')
      .insert({
        creator_id: creatorId,
        type: action.type,
        reason: action.reason,
        expires_at: expiresAt?.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      });

    if (moderationError) throw moderationError;

    const updates: any = {
      status: action.type === 'warning' ? 'warned' : action.type,
      restricted_until: expiresAt?.toISOString(),
      updated_at: now.toISOString()
    };

    const { error: updateError } = await supabase
      .from('creators')
      .update(updates)
      .eq('id', creatorId);

    if (updateError) throw updateError;

    const notification = {
      creator_id: creatorId,
      type: `account_${action.type}`,
      title: `Account ${action.type === 'warning' ? 'Warning' : action.type === 'restrict' ? 'Restricted' : 'Banned'}`,
      message: `Your account has been ${action.type === 'warning' ? 'warned' : action.type === 'restrict' ? 'restricted' : 'banned'} for the following reason: ${action.reason}`,
      metadata: {
        type: action.type,
        reason: action.reason,
        duration: action.duration,
        expiresAt: expiresAt?.toISOString()
      },
      read: false,
      created_at: now.toISOString(),
      updated_at: now.toISOString()
    };

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notification);

    if (notificationError) throw notificationError;
  }

  async getModerationHistory(creatorId: string): Promise<ModerationType[]> {
    const { data, error } = await supabase
      .from('moderation_actions')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as ModerationType[];
  }

  // ===== PUSH SUBSCRIPTIONS =====
  async createPushSubscription(data: { userAddress: string; subscription: string; endpoint: string }): Promise<void> {
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_address: data.userAddress,
        subscription: data.subscription,
        endpoint: data.endpoint,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_address'
      });

    if (error) throw error;
  }

  async getPushSubscriptionsByUser(userAddress: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_address', userAddress);

    if (error) throw error;
    return data || [];
  }

  async getAllPushSubscriptions(): Promise<any[]> {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;
    return data || [];
  }

  // ===== COMMENTS =====
  async createComment(comment: InsertComment): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        coin_address: comment.coinAddress,
        user_address: comment.userAddress,
        comment: comment.comment,
        transaction_hash: comment.transactionHash,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as Comment;
  }

  async getCommentsByCoin(coinAddress: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('coin_address', coinAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Comment[];
  }

  async getAllComments(): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Comment[];
  }

  // ===== FOLLOWS =====
  async createFollow(insertFollow: InsertFollow): Promise<Follow> {
    const { data, error } = await supabase
      .from('follows')
      .insert({
        follower_address: insertFollow.followerAddress,
        following_address: insertFollow.followingAddress,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as Follow;
  }

  async deleteFollow(followerAddress: string, followingAddress: string): Promise<boolean> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_address', followerAddress)
      .eq('following_address', followingAddress);

    if (error) throw error;
    return true;
  }

  async getFollowers(userAddress: string): Promise<Follow[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('following_address', userAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Follow[];
  }

  async getFollowing(userAddress: string): Promise<Follow[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_address', userAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Follow[];
  }

  async isFollowing(followerAddress: string, followingAddress: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_address', followerAddress)
      .eq('following_address', followingAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  // ===== REFERRALS =====
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        referrer_address: insertReferral.referrerAddress,
        referred_address: insertReferral.referredAddress,
        referral_code: insertReferral.referralCode,
        points_earned: insertReferral.pointsEarned || '100',
        claimed: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data as Referral;
  }

  async getReferralsByReferrer(referrerAddress: string): Promise<Referral[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_address', referrerAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Referral[];
  }

  async getReferralsByCode(referralCode: string): Promise<Referral[]> {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Referral[];
  }

  async getReferralByAddresses(referrerAddress: string, referredAddress: string): Promise<Referral | undefined> {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_address', referrerAddress)
      .eq('referred_address', referredAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as Referral | undefined;
  }

  // ===== LOGIN STREAKS =====
  async getLoginStreak(userAddress: string): Promise<LoginStreak | undefined> {
    const { data, error } = await supabase
      .from('login_streaks')
      .select('*')
      .eq('user_address', userAddress)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as LoginStreak | undefined;
  }

  async createLoginStreak(insertLoginStreak: InsertLoginStreak): Promise<LoginStreak> {
    const { data, error } = await supabase
      .from('login_streaks')
      .insert({
        user_address: insertLoginStreak.userAddress,
        current_streak: insertLoginStreak.currentStreak || '0',
        longest_streak: insertLoginStreak.longestStreak || '0',
        last_login_date: insertLoginStreak.lastLoginDate || null,
        total_points: insertLoginStreak.totalPoints || '0',
        login_dates: insertLoginStreak.loginDates || []
      })
      .select()
      .single();

    if (error) throw error;
    return data as LoginStreak;
  }

  async updateLoginStreak(userAddress: string, update: UpdateLoginStreak): Promise<LoginStreak | undefined> {
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (update.currentStreak !== undefined) updates.current_streak = update.currentStreak;
    if (update.longestStreak !== undefined) updates.longest_streak = update.longestStreak;
    if (update.lastLoginDate !== undefined) updates.last_login_date = update.lastLoginDate;
    if (update.totalPoints !== undefined) updates.total_points = update.totalPoints;
    if (update.loginDates !== undefined) updates.login_dates = update.loginDates;

    const { data, error } = await supabase
      .from('login_streaks')
      .update(updates)
      .eq('user_address', userAddress)
      .select()
      .single();

    if (error) throw error;
    return data as LoginStreak | undefined;
  }
}

export const storage = new SupabaseStorage();

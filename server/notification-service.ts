import { storage } from './supabase-storage';
import { sendTelegramNotification } from './telegram-bot';
import type { Reward, Creator, Coin } from '@shared/schema';

// Randomized earnings notification messages
const EARNINGS_MESSAGES = [
  "💰 Ka-ching! You've earned {amount} from {coin}!",
  "🎉 Great news! {amount} just landed in your wallet from {coin}",
  "💎 You're making moves! {amount} earned from {coin}",
  "🔥 Hot earnings alert! {amount} from {coin} is yours",
  "⚡ Zap! {amount} just hit your account from {coin}",
  "🌟 Success! You've earned {amount} from {coin} trades",
  "💸 Money alert! {amount} from {coin} arrived",
  "🎯 Bulls-eye! {amount} earned from {coin}",
  "🚀 To the moon! {amount} from {coin} deposited",
  "💵 Cha-ching! {amount} from {coin} is in your wallet",
  "🏆 Winner! You earned {amount} from {coin}",
  "✨ Sweet! {amount} from {coin} just dropped",
];

const TOP_TRADER_MESSAGES = [
  "🔥 {trader} is on fire! Earned {amount} in the last {period}",
  "💎 Whale alert! {trader} made {amount} in {period}",
  "🚀 {trader} just crushed it with {amount} in {period}!",
  "⚡ Power move! {trader} earned {amount} in {period}",
  "👑 King of trades! {trader} made {amount} in {period}",
  "🎯 Perfect execution! {trader} earned {amount} in {period}",
  "💰 Big money! {trader} raked in {amount} in {period}",
  "🌟 Star trader {trader} earned {amount} in {period}",
  "🔮 Magic touch! {trader} made {amount} in {period}",
];

// Format number with commas
function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0.00';
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Format address
function formatAddress(address: string): string {
  if (!address) return 'Unknown';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Calculate time periods
function getTimePeriod(hours: number): Date {
  const now = new Date();
  return new Date(now.getTime() - hours * 60 * 60 * 1000);
}

export class NotificationService {
  
  // Get top creators by total volume
  async getTopCreatorsByVolume(limit: number = 10): Promise<Creator[]> {
    const creators = await storage.getAllCreators();
    return creators
      .sort((a, b) => parseFloat(b.totalVolume || '0') - parseFloat(a.totalVolume || '0'))
      .slice(0, limit);
  }

  // Get top creators by points
  async getTopCreatorsByPoints(limit: number = 10): Promise<Creator[]> {
    const creators = await storage.getAllCreators();
    return creators
      .sort((a, b) => parseFloat(b.points || '0') - parseFloat(a.points || '0'))
      .slice(0, limit);
  }

  // Get top earners from rewards
  async getTopEarners(limit: number = 10, hoursAgo?: number): Promise<Array<{address: string, totalEarnings: number, rewardCount: number}>> {
    const rewards = await storage.getAllRewards();
    
    // Filter by time if specified
    let filteredRewards = rewards;
    if (hoursAgo) {
      const cutoff = getTimePeriod(hoursAgo);
      filteredRewards = rewards.filter(r => new Date(r.createdAt) >= cutoff);
    }

    // Aggregate earnings by recipient
    const earningsMap = new Map<string, { totalEarnings: number, rewardCount: number }>();
    
    for (const reward of filteredRewards) {
      const current = earningsMap.get(reward.recipientAddress) || { totalEarnings: 0, rewardCount: 0 };
      const amount = parseFloat(reward.rewardAmount) / 1e18; // Convert from wei to ETH
      current.totalEarnings += amount;
      current.rewardCount += 1;
      earningsMap.set(reward.recipientAddress, current);
    }

    // Convert to array and sort
    return Array.from(earningsMap.entries())
      .map(([address, data]) => ({ address, ...data }))
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, limit);
  }

  // Get top coins (you can customize the metric)
  async getTopCoins(limit: number = 10): Promise<Coin[]> {
    const coins = await storage.getAllCoins();
    // For now, sort by creation date (most recent first)
    // You can modify this to sort by volume or other metrics when available
    return coins
      .filter(c => c.status === 'active' && c.address)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Get recent trades (based on recent rewards)
  async getRecentTrades(limit: number = 20): Promise<Reward[]> {
    const rewards = await storage.getAllRewards();
    return rewards
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  // Send earnings notification with randomized message
  async notifyUserEarnings(userAddress: string, reward: Reward): Promise<void> {
    const amount = (parseFloat(reward.rewardAmount) / 1e18).toFixed(4);
    const template = EARNINGS_MESSAGES[Math.floor(Math.random() * EARNINGS_MESSAGES.length)];
    
    const message = template
      .replace('{amount}', `${amount} ${reward.rewardCurrency}`)
      .replace('{coin}', reward.coinSymbol);

    const title = `💰 Earnings Received!`;
    
    // Save to database
    await storage.createNotification({
      userId: userAddress,
      type: 'reward',
      title,
      message,
      coinAddress: reward.coinAddress,
      coinSymbol: reward.coinSymbol,
      amount: reward.rewardAmount,
      transactionHash: reward.transactionHash,
    });

    // Send to Telegram
    await sendTelegramNotification(
      userAddress,
      title,
      message,
      'reward'
    );
  }

  // Notify about top traders
  async notifyTopTraders(hours: number): Promise<void> {
    const topEarners = await this.getTopEarners(5, hours);
    
    if (topEarners.length === 0) return;

    const periodText = hours <= 10 ? `${hours} hours` : 
                       hours === 24 ? '24 hours' :
                       `${Math.floor(hours / 24)} days`;

    for (const earner of topEarners) {
      const template = TOP_TRADER_MESSAGES[Math.floor(Math.random() * TOP_TRADER_MESSAGES.length)];
      const message = template
        .replace('{trader}', formatAddress(earner.address))
        .replace('{amount}', `$${formatNumber(earner.totalEarnings)}`)
        .replace('{period}', periodText);

      const title = `🏆 Top Trader Alert - ${periodText}`;

      // Broadcast to channel
      const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
      if (TELEGRAM_CHANNEL_ID) {
        try {
          const { bot } = await import('./telegram-bot');
          if (bot) {
            await bot.sendMessage(
              TELEGRAM_CHANNEL_ID,
              `${title}\n\n${message}\n\n💎 Trader: [${formatAddress(earner.address)}](https://zora.co/profile/${earner.address})\n📊 Total Earnings: $${formatNumber(earner.totalEarnings)}\n🎯 Trades: ${earner.rewardCount}`,
              { parse_mode: 'Markdown', disable_web_page_preview: false }
            );
          }
        } catch (error) {
          console.error('Error broadcasting top trader:', error);
        }
      }
    }
  }

  // Send top creators notification
  async sendTopCreatorsNotification(): Promise<void> {
    const topCreators = await this.getTopCreatorsByVolume(10);
    
    if (topCreators.length === 0) return;

    let message = `👑 TOP CREATORS BY VOLUME\n\n`;
    
    topCreators.forEach((creator, index) => {
      const volume = parseFloat(creator.totalVolume || '0');
      message += `${index + 1}. ${creator.name || formatAddress(creator.address)}\n`;
      message += `   💰 Volume: $${formatNumber(volume)}\n`;
      message += `   🪙 Coins: ${creator.totalCoins}\n`;
      message += `   ⭐ Points: ${formatNumber(parseFloat(creator.points || '0'))}\n\n`;
    });

    const title = `👑 Top Creators Leaderboard`;

    // Broadcast to channel
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
    if (TELEGRAM_CHANNEL_ID) {
      try {
        const { bot } = await import('./telegram-bot');
        if (bot) {
          await bot.sendMessage(
            TELEGRAM_CHANNEL_ID,
            `${title}\n\n${message}`,
            { parse_mode: 'Markdown', disable_web_page_preview: true }
          );
        }
      } catch (error) {
        console.error('Error broadcasting top creators:', error);
      }
    }
  }

  // Send top earners notification
  async sendTopEarnersNotification(hours?: number): Promise<void> {
    const topEarners = await this.getTopEarners(10, hours);
    
    if (topEarners.length === 0) return;

    const periodText = hours ? 
      (hours <= 10 ? `${hours} hours` : 
       hours === 24 ? '24 hours' :
       `${Math.floor(hours / 24)} days`) : 
      'All Time';

    let message = `💎 TOP EARNERS - ${periodText.toUpperCase()}\n\n`;
    
    topEarners.forEach((earner, index) => {
      message += `${index + 1}. [${formatAddress(earner.address)}](https://zora.co/profile/${earner.address})\n`;
      message += `   💰 Earnings: $${formatNumber(earner.totalEarnings)}\n`;
      message += `   🎯 Trades: ${earner.rewardCount}\n\n`;
    });

    const title = `💎 Top Earners - ${periodText}`;

    // Broadcast to channel
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
    if (TELEGRAM_CHANNEL_ID) {
      try {
        const { bot } = await import('./telegram-bot');
        if (bot) {
          await bot.sendMessage(
            TELEGRAM_CHANNEL_ID,
            `${title}\n\n${message}`,
            { parse_mode: 'Markdown', disable_web_page_preview: false }
          );
        }
      } catch (error) {
        console.error('Error broadcasting top earners:', error);
      }
    }
  }

  // Send top coins notification
  async sendTopCoinsNotification(): Promise<void> {
    const topCoins = await this.getTopCoins(10);
    
    if (topCoins.length === 0) return;

    let message = `🏆 TOP TRENDING COINS\n\n`;
    
    topCoins.forEach((coin, index) => {
      message += `${index + 1}. *${coin.name}* (${coin.symbol})\n`;
      message += `   👤 Creator: [${formatAddress(coin.creator_wallet)}](https://zora.co/profile/${coin.creator_wallet})\n`;
      if (coin.address) {
        message += `   🔗 [Trade Now](https://zora.co/creator-coins/base:${coin.address})\n`;
      }
      message += `\n`;
    });

    const title = `🏆 Top Trending Coins`;

    // Broadcast to channel
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
    if (TELEGRAM_CHANNEL_ID) {
      try {
        const { bot } = await import('./telegram-bot');
        if (bot) {
          await bot.sendMessage(
            TELEGRAM_CHANNEL_ID,
            `${title}\n\n${message}`,
            { parse_mode: 'Markdown', disable_web_page_preview: false }
          );
        }
      } catch (error) {
        console.error('Error broadcasting top coins:', error);
      }
    }
  }

  // Send top points earners notification
  async sendTopPointsNotification(): Promise<void> {
    const topCreators = await this.getTopCreatorsByPoints(10);
    
    if (topCreators.length === 0) return;

    let message = `⭐ TOP POINTS EARNERS\n\n`;
    
    topCreators.forEach((creator, index) => {
      const points = parseFloat(creator.points || '0');
      message += `${index + 1}. ${creator.name || formatAddress(creator.address)}\n`;
      message += `   ⭐ Points: ${formatNumber(points)}\n`;
      message += `   🪙 Coins: ${creator.totalCoins}\n`;
      message += `   📊 Volume: $${formatNumber(parseFloat(creator.totalVolume || '0'))}\n\n`;
    });

    const title = `⭐ Top Points Earners`;

    // Broadcast to channel
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
    if (TELEGRAM_CHANNEL_ID) {
      try {
        const { bot } = await import('./telegram-bot');
        if (bot) {
          await bot.sendMessage(
            TELEGRAM_CHANNEL_ID,
            `${title}\n\n${message}`,
            { parse_mode: 'Markdown', disable_web_page_preview: true }
          );
        }
      } catch (error) {
        console.error('Error broadcasting top points:', error);
      }
    }
  }

  // Send recent trades notification
  async sendRecentTradesNotification(): Promise<void> {
    const recentTrades = await this.getRecentTrades(10);
    
    if (recentTrades.length === 0) return;

    let message = `📊 RECENT TRADING ACTIVITY\n\n`;
    
    recentTrades.forEach((trade, index) => {
      const amount = (parseFloat(trade.rewardAmount) / 1e18).toFixed(4);
      message += `${index + 1}. ${trade.coinSymbol}\n`;
      message += `   💰 ${amount} ${trade.rewardCurrency}\n`;
      message += `   👤 [${formatAddress(trade.recipientAddress)}](https://zora.co/profile/${trade.recipientAddress})\n`;
      message += `   🔗 [Tx](https://basescan.org/tx/${trade.transactionHash})\n\n`;
    });

    const title = `📊 Recent Trades`;

    // Broadcast to channel
    const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
    if (TELEGRAM_CHANNEL_ID) {
      try {
        const { bot } = await import('./telegram-bot');
        if (bot) {
          await bot.sendMessage(
            TELEGRAM_CHANNEL_ID,
            `${title}\n\n${message}`,
            { parse_mode: 'Markdown', disable_web_page_preview: false }
          );
        }
      } catch (error) {
        console.error('Error broadcasting recent trades:', error);
      }
    }
  }

  // Weekly top earners (convenience method)
  async sendWeeklyTopEarnersNotification(): Promise<void> {
    await this.sendTopEarnersNotification(24 * 7); // 7 days
  }

  // Send all periodic notifications
  async sendAllPeriodicNotifications(): Promise<void> {
    console.log('📢 Sending periodic notifications...');
    
    try {
      await this.sendTopCreatorsNotification();
      await this.sendTopEarnersNotification(24); // 24h
      await this.sendTopCoinsNotification();
      await this.sendTopPointsNotification();
      await this.sendRecentTradesNotification();
      
      console.log('✅ All periodic notifications sent successfully');
    } catch (error) {
      console.error('❌ Error sending periodic notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();

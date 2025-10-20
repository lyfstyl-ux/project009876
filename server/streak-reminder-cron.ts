
import cron from 'node-cron';
import { storage } from './supabase-storage';
import { sendTelegramNotification } from './telegram-bot';

// Run every 6 hours to remind users about unclaimed points
export function startStreakReminderCron() {
  // Run at 9 AM, 3 PM, and 9 PM daily
  cron.schedule('0 9,15,21 * * *', async () => {
    try {
      console.log('🔔 Running streak reminder check...');
      
      const creators = await storage.getAllCreators();
      const today = new Date().toISOString().split('T')[0];
      let remindersCount = 0;

      for (const creator of creators) {
        try {
          const loginStreak = await storage.getLoginStreak(creator.address);

          // New user - hasn't claimed first bonus
          if (!loginStreak) {
            await storage.createNotification({
              userId: creator.address,
              type: 'reward',
              title: '🎁 Claim Your Welcome Bonus!',
              message: 'You have 10 points waiting for you! Visit the app to claim your first daily login bonus and start your streak.',
              amount: '10',
              read: false,
            });

            await sendTelegramNotification(
              creator.address,
              '🎁 Claim Your Welcome Bonus!',
              'You have 10 points waiting! Visit the app to claim your first daily login bonus 🔥',
              'reward'
            );

            remindersCount++;
            continue;
          }

          // User hasn't claimed today's points
          if (loginStreak.lastLoginDate !== today) {
            const lastLogin = new Date(loginStreak.lastLoginDate || today);
            const todayDate = new Date(today);
            const daysDiff = Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
            
            let currentStreak = parseInt(loginStreak.currentStreak || '0');
            let pointsAvailable = 10;
            let streakStatus = '';

            if (daysDiff === 1) {
              const nextStreak = currentStreak + 1;
              pointsAvailable = 10 + Math.min(Math.floor(nextStreak / 7) * 5, 50);
              streakStatus = `Continue your ${currentStreak} day streak`;
            } else {
              pointsAvailable = 10;
              streakStatus = `Your ${currentStreak} day streak will reset`;
            }

            await storage.createNotification({
              userId: creator.address,
              type: 'reward',
              title: '🔥 Daily Points Waiting!',
              message: `${streakStatus}! Claim ${pointsAvailable} points now by visiting the app. Don't let your streak expire!`,
              amount: pointsAvailable.toString(),
              read: false,
            });

            await sendTelegramNotification(
              creator.address,
              '🔥 Daily Points Waiting!',
              `${streakStatus}! Claim ${pointsAvailable} points now 🎁`,
              'reward'
            );

            remindersCount++;
          }
        } catch (error) {
          console.error(`Error sending reminder to ${creator.address}:`, error);
        }
      }

      console.log(`✅ Sent ${remindersCount} streak reminders`);
    } catch (error) {
      console.error('❌ Streak reminder cron error:', error);
    }
  });

  console.log('✅ Streak reminder cron started (runs at 9 AM, 3 PM, and 9 PM daily)');
}

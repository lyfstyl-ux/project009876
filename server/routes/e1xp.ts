import { Router } from 'express';
import { Storage } from '../storage';

export function createE1XPRouter(storage: Storage) {
  const router = Router();

  // Get E1XP status (points, streak, etc)
  router.get('/status', async (req, res) => {
    try {
      const creatorId = req.session?.user?.id;
      if (!creatorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const creator = await storage.getCreator(creatorId);
      if (!creator) {
        return res.status(404).json({ error: 'Creator not found' });
      }

      const pointsStatus = await storage.getDailyPointsStatus(creatorId);
      const points = parseInt(creator.points || '0');

      res.json({
        points,
        streak: pointsStatus.streak,
        nextClaimAmount: pointsStatus.nextClaimAmount,
        daysUntilBonus: 7 - (pointsStatus.streak % 7),
        canClaimDaily: !pointsStatus.claimed,
        lastClaimDate: pointsStatus.lastClaimDate
      });
    } catch (error) {
      console.error('Failed to get E1XP status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Claim daily points
  router.post('/claim-daily', async (req, res) => {
    try {
      const creatorId = req.session?.user?.id;
      if (!creatorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const pointsEarned = await storage.claimDailyPoints(creatorId);
      res.json({ pointsEarned });
    } catch (error: any) {
      if (error.message === 'Daily points already claimed') {
        return res.status(400).json({ error: error.message });
      }
      console.error('Failed to claim daily points:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Award points for other actions
  router.post('/award', async (req, res) => {
    try {
      const { creatorId, amount, reason, type } = req.body;
      
      // Only allow this endpoint for admin users or system actions
      if (!req.session?.user?.isAdmin) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await storage.awardPoints(creatorId, amount, reason, type);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to award points:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get notifications
  router.get('/notifications', async (req, res) => {
    try {
      const creatorId = req.session?.user?.id;
      if (!creatorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const notifications = await storage.getUserNotifications(creatorId);
      res.json(notifications);
    } catch (error) {
      console.error('Failed to get notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Mark notification as read
  router.post('/notifications/:id/read', async (req, res) => {
    try {
      const creatorId = req.session?.user?.id;
      if (!creatorId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await storage.markNotificationAsRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
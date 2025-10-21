import { Router } from 'express';
import { Storage } from '../storage';

// Note: keep types loose here to avoid coupling to schema type mismatches in runtime

export function createAdminRouter(storage: Storage) {
  const router = Router();

  // Middleware to check admin status
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session?.user?.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    next();
  };

  // Moderate user
  router.post('/moderate', requireAdmin, async (req, res) => {
    try {
      const { address, type, duration, reason } = req.body;
      
      // Get creator by address
      const creator = await storage.getCreatorByAddress(address);
      if (!creator) {
        return res.status(404).json({ error: 'User not found' });
      }

      const action = { type, duration, reason } as any;

      await storage.moderateUser(creator.id, action as any);
      res.json({ success: true });
    } catch (error) {
      console.error('Moderation failed:', error);
      res.status(500).json({ error: 'Failed to moderate user' });
    }
  });

  // Test notifications
  router.post('/test-notification', requireAdmin, async (req, res) => {
    try {
      const { type, title: rawTitle, message: rawMessage, address, userId } = req.body;

      // Provide safe defaults so admin testing UI can send minimal payloads
      const title = rawTitle || `Test: ${type || 'notification'}`;
      const message = rawMessage || `This is a test ${type || 'notification'} from admin`;

      // Determine target - support 'all', address, or userId (client sends userId)
      if (address === 'all' || userId === 'all') {
        // Send to all users
        const creators = await storage.getAllCreators();
          const promises = creators.map(creator =>
            storage.createNotification({
              creator_id: creator.id,
              type: type,
              title,
              message,
              metadata: { isTest: true },
              read: false,
            } as any)
          );
        await Promise.all(promises);
      } else {
        // If userId provided, send to that user; otherwise try address
        const target = userId || address;
        if (!target) return res.status(400).json({ error: 'Missing target address or userId' });

        const creator = await storage.getCreatorByAddress(target);
        if (!creator) {
          // Try sending as user_id directly
          await storage.createNotification({
            userId: target,
            type: type,
            title,
            message,
            metadata: { isTest: true },
            read: false,
          } as any);
        } else {
          await storage.createNotification({
            creator_id: creator.id,
            type: type,
            title,
            message,
            metadata: { isTest: true },
            read: false,
          } as any);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Notification test failed:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  });

  // Alias for client compatibility
  router.post('/trigger-notification', requireAdmin, async (req, res) => {
    // Reuse the test-notification handler logic by calling the same route handler
    // Simpler: forward the request body to storage.createNotification(s) similar to /test-notification
    try {
      const { type, title: rawTitle, message: rawMessage, address, userId } = req.body;
      const title = rawTitle || `Trigger: ${type || 'notification'}`;
      const message = rawMessage || `Triggered ${type || 'notification'} from admin`;

      if (address === 'all' || userId === 'all') {
        const creators = await storage.getAllCreators();
        await Promise.all(
          creators.map((creator) =>
            storage.createNotification({ userId: creator.address, type, title, message, metadata: { isTest: true }, read: false } as any)
          )
        );
      } else {
        const target = userId || address;
        if (!target) return res.status(400).json({ error: 'Missing target address or userId' });

        const creator = await storage.getCreatorByAddress(target);
        if (!creator) {
          await storage.createNotification({ userId: target, type, title, message, metadata: { isTest: true }, read: false } as any);
        } else {
          await storage.createNotification({ creator_id: creator.id, type, title, message, metadata: { isTest: true }, read: false } as any);
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Trigger notification failed:', error);
      res.status(500).json({ error: 'Failed to trigger notification' });
    }
  });

  // Hide a coin (mark as hidden)
  router.post('/hide-coin/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const coin = await storage.updateCoin(id, { hidden: true } as any);
      if (!coin) return res.status(404).json({ error: 'Coin not found' });
      res.json(coin);
    } catch (error) {
      console.error('Hide coin failed:', error);
      res.status(500).json({ error: 'Failed to hide coin' });
    }
  });

  // Admin create coin (does not add admin to creator list if admin lists a coin)
  router.post('/create-coin', requireAdmin, async (req, res) => {
    try {
      const coinData = req.body;

      // Allow admin to specify a creatorAddress; if omitted, do not auto-create a creator
      const creatorAddress = coinData.creatorAddress || coinData.creator_wallet || null;

      const insert = {
        name: coinData.name,
        symbol: coinData.symbol,
        address: coinData.address || null,
        creator_wallet: creatorAddress,
        status: coinData.status || 'active',
        ipfs_uri: coinData.ipfsUri || coinData.ipfs_uri || null,
        chain_id: coinData.chainId || coinData.chain_id || null,
        image: coinData.image || null,
        description: coinData.description || null,
        created_at: new Date().toISOString(),
      };

      const coin = await storage.createCoin(insert as any);

      // If a creatorAddress was provided, create or update the creator's stats but do not mark admin as creator
      if (creatorAddress) {
        let creator = await storage.getCreatorByAddress(creatorAddress);
        if (!creator) {
          await storage.createCreator({ address: creatorAddress } as any);
        } else {
          const newTotal = (parseInt(creator.totalCoins || '0') + 1).toString();
          await storage.updateCreator(creator.id, { totalCoins: newTotal } as any);
        }
      }

      res.json(coin);
    } catch (error) {
      console.error('Admin create coin failed:', error);
      res.status(500).json({ error: 'Failed to create coin' });
    }
  });

  // Show a coin (unhide)
  router.post('/show-coin/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const coin = await storage.updateCoin(id, { hidden: false } as any);
      if (!coin) return res.status(404).json({ error: 'Coin not found' });
      res.json(coin);
    } catch (error) {
      console.error('Show coin failed:', error);
      res.status(500).json({ error: 'Failed to show coin' });
    }
  });

  // Remove a coin (soft-delete by setting status)
  router.post('/remove-coin/:id', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const coin = await storage.updateCoin(id, { status: 'removed' } as any);
      if (!coin) return res.status(404).json({ error: 'Coin not found' });
      res.json({ success: true });
    } catch (error) {
      console.error('Remove coin failed:', error);
      res.status(500).json({ error: 'Failed to remove coin' });
    }
  });

  // Hide a creator (soft-restrict using moderation)
  router.post('/hide-creator/:address', requireAdmin, async (req, res) => {
    try {
      const { address } = req.params;
      if (!address) return res.status(400).json({ error: 'Missing creator address' });

      const creator = await storage.getCreatorByAddress(address);
      if (!creator) return res.status(404).json({ error: 'Creator not found' });

      // Use moderation to restrict the creator account
      await storage.moderateUser(creator.id, { type: 'restrict', reason: 'Hidden by admin', duration: 0 } as any);
      res.json({ success: true });
    } catch (error) {
      console.error('Hide creator failed:', error);
      res.status(500).json({ error: 'Failed to hide creator' });
    }
  });

  // Remove a creator (ban)
  router.post('/remove-creator/:address', requireAdmin, async (req, res) => {
    try {
      const { address } = req.params;
      if (!address) return res.status(400).json({ error: 'Missing creator address' });

      const creator = await storage.getCreatorByAddress(address);
      if (!creator) return res.status(404).json({ error: 'Creator not found' });

      await storage.moderateUser(creator.id, { type: 'ban', reason: 'Removed by admin' } as any);
      res.json({ success: true });
    } catch (error) {
      console.error('Remove creator failed:', error);
      res.status(500).json({ error: 'Failed to remove creator' });
    }
  });

  // Gift E1XP to a user
  router.post('/gift-e1xp', requireAdmin, async (req, res) => {
    try {
      const { recipientAddress, recipients, amount, reason, all } = req.body;
      const giftAmount = Number(amount);
      if ((!recipientAddress && !recipients) || !giftAmount) {
        return res.status(400).json({ error: 'Missing recipient(s) or amount' });
      }

      const targets: string[] = [];
      if (all === true || recipientAddress === 'all' || recipientAddress === 'ALL') {
        // send to everyone
        const creators = await storage.getAllCreators();
        for (const c of creators) {
          targets.push(c.address as string);
        }
      } else {
        if (recipientAddress) targets.push(recipientAddress);
        if (Array.isArray(recipients)) targets.push(...recipients);
      }

      for (const target of targets) {
        try {
          await storage.awardPoints(target, giftAmount, reason || 'Admin Gift', 'points_earned' as any);
        } catch (err) {
          console.error('Failed to award points to', target, err);
        }
      }

      res.json({ success: true, recipients: targets.length });
    } catch (error) {
      console.error('Gift E1XP failed:', error);
      res.status(500).json({ error: 'Failed to gift E1XP' });
    }
  });

  // Get moderation history
  router.get('/moderation-history/:address', requireAdmin, async (req, res) => {
    try {
      const creator = await storage.getCreatorByAddress(req.params.address);
      if (!creator) {
        return res.status(404).json({ error: 'User not found' });
      }

      const history = await storage.getModerationHistory(creator.id);
      res.json(history);
    } catch (error) {
      console.error('Failed to get moderation history:', error);
      res.status(500).json({ error: 'Failed to get moderation history' });
    }
  });

  return router;
}
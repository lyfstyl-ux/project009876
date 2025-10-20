import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertScrapedContentSchema,
  insertCoinSchema,
  updateCoinSchema,
  insertCommentSchema,
  insertNotificationSchema,
  insertFollowSchema,
  insertReferralSchema,
} from "@shared/schema";
import axios from "axios";
import { detectPlatform } from "./platform-detector";
import { scrapeByPlatform } from "./platform-scrapers";
import { migrateOldData } from "./migrate-old-data";
import { sendTelegramNotification } from "./telegram-bot";
import { RegistryService } from "./registry-service";
import { ActivityTrackerService } from "./activity-tracker-service";
import { base } from "viem/chains";
import { handleFileUpload } from "./upload-handler"; // Import the upload handler

export async function registerRoutes(app: Express): Promise<Server> {
  // GeckoTerminal API endpoints
  app.get(
    "/api/geckoterminal/pools/:network/:tokenAddress",
    async (req, res) => {
      try {
        const { network, tokenAddress } = req.params;
        const page = parseInt((req.query.page as string) || "1");

        const response = await axios.get(
          `https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${tokenAddress}/pools`,
          { params: { page } },
        );

        res.json(response.data);
      } catch (error) {
        console.error("GeckoTerminal pool search error:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch pool data from GeckoTerminal" });
      }
    },
  );

  app.get("/api/geckoterminal/pool/:network/:poolAddress", async (req, res) => {
    try {
      const { network, poolAddress } = req.params;
      const include = (req.query.include as string) || "base_token,quote_token";

      const response = await axios.get(
        `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}`,
        { params: { include } },
      );

      res.json(response.data);
    } catch (error) {
      console.error("GeckoTerminal pool data error:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch pool details from GeckoTerminal" });
    }
  });

  app.get(
    "/api/geckoterminal/ohlcv/:network/:poolAddress/:timeframe",
    async (req, res) => {
      try {
        const { network, poolAddress, timeframe } = req.params;
        const {
          aggregate = "1",
          limit = "100",
          currency = "usd",
          token = "base",
        } = req.query;

        const response = await axios.get(
          `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/ohlcv/${timeframe}`,
          { params: { aggregate, limit, currency, token } },
        );

        res.json(response.data);
      } catch (error) {
        console.error("GeckoTerminal OHLCV data error:", error);
        res
          .status(500)
          .json({ error: "Failed to fetch chart data from GeckoTerminal" });
      }
    },
  );

  // File upload endpoint
  app.post("/api/upload", handleFileUpload);

  // Create scraped content endpoint (for direct content creation)
  app.post("/api/scraped-content", async (req, res) => {
    try {
      const validatedData = insertScrapedContentSchema.parse(req.body);
      const stored = await storage.createScrapedContent(validatedData);
      res.json(stored);
    } catch (error) {
      console.error("Create scraped content error:", error);
      res.status(400).json({
        error: "Invalid scraped content data",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Scrape URL endpoint
  app.post("/api/scrape", async (req, res) => {
    try {
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ error: "URL is required" });
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: "Invalid URL format" });
      }

      // Detect platform
      const platformInfo = detectPlatform(url);

      // Scrape content using platform-specific logic
      const scrapedData = await scrapeByPlatform(url, platformInfo.type);

      // Validate and store
      const validatedData = insertScrapedContentSchema.parse(scrapedData);
      const stored = await storage.createScrapedContent(validatedData);

      res.json(stored);
    } catch (error) {
      console.error("Scraping error:", error);

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          return res.status(408).json({
            error: "Request timeout - the page took too long to load",
          });
        }
        if (error.response?.status === 404) {
          return res.status(404).json({
            error: "Page not found - please check the URL is correct",
          });
        }
        if (error.response?.status === 403) {
          return res.status(403).json({
            error: "Access forbidden - this platform blocks automated access",
          });
        }
        if (error.response?.status === 429) {
          return res.status(429).json({
            error:
              "Rate limit exceeded - Instagram and TikTok often block scrapers. Try YouTube, Medium, or blog URLs instead.",
          });
        }
      }

      res.status(500).json({
        error:
          "Failed to scrape content - some platforms block automated access. Try a different URL or platform.",
      });
    }
  });

  // Get all coins
  app.get("/api/coins", async (req, res) => {
    try {
      const coins = await storage.getAllCoins();

      // Add platform detection to each coin based on available fields
      const coinsWithPlatform = coins.map((coin) => {
        let platform = "all";

        // Check multiple sources for URL
        const urls = [coin.image, coin.description, coin.name]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (urls.includes("youtube.com") || urls.includes("youtu.be")) {
          platform = "youtube";
        } else if (
          urls.includes("warpcast.com") ||
          urls.includes("farcaster")
        ) {
          platform = "farcaster";
        } else if (urls.includes("gitcoin.co")) {
          platform = "gitcoin";
        } else if (
          urls.includes("spotify.com") ||
          urls.includes("open.spotify")
        ) {
          platform = "spotify";
        } else if (urls.includes("tiktok.com")) {
          platform = "tiktok";
        } else if (urls.includes("instagram.com")) {
          platform = "instagram";
        } else if (urls.includes("medium.com")) {
          platform = "medium";
        } else if (urls.includes("giveth.io")) {
          platform = "giveth";
        } else if (urls.includes("twitter.com") || urls.includes("x.com")) {
          platform = "twitter";
        } else if (
          urls.includes("blog") ||
          urls.includes("wordpress") ||
          urls.includes("blogspot")
        ) {
          platform = "blog";
        }

        return {
          ...coin,
          platform,
        };
      });

      res.json(coinsWithPlatform);
    } catch (error: any) {
      console.error("Error fetching coins:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get coins by creator
  app.get("/api/coins/creator/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const coins = await storage.getCoinsByCreator(address);
      res.json(coins);
    } catch (error) {
      console.error("Get creator coins error:", error);
      res.status(500).json({ error: "Failed to fetch creator coins" });
    }
  });

  // Create coin
  app.post("/api/coins", async (req, res) => {
    try {
      const validatedData = insertCoinSchema.parse(req.body);
      const coin = await storage.createCoin(validatedData);

      // Auto-create or update creator (only if creator address exists)
      const creatorAddress = validatedData.creator_wallet;
      if (!creatorAddress) {
        return res.status(400).json({ error: "Creator address is required" });
      }

      let creator = await storage.getCreatorByAddress(creatorAddress);
      if (!creator) {
        // Create new creator with referral code (will be set when they set username)
        creator = await storage.createCreator({
          address: creatorAddress,
          totalCoins: "1",
          totalVolume: "0",
          followers: "0",
          referralCode: null,
        });
      } else {
        // Update existing creator's coin count
        const newTotalCoins = (parseInt(creator.totalCoins) + 1).toString();
        await storage.updateCreator(creator.id, {
          totalCoins: newTotalCoins,
        });
      }

      // Create in-app notification for coin creation
      await storage.createNotification({
        userId: creatorAddress,
        type: "coin_created",
        title: "🪙 Coin Created Successfully!",
        message: `Your coin "${coin.name}" (${coin.symbol}) has been created${coin.address ? " and is now live on the blockchain!" : "!"}`,
        coinAddress: coin.address,
        coinSymbol: coin.symbol,
        read: false,
      });

      // Notify creator about successful coin creation
      const { notificationService } = await import("./notification-service");
      await notificationService.notifyCoinCreated(creatorAddress, coin);


      // Record on-chain if coin has been deployed (has address)
      if (coin.address && coin.status === "active") {
        try {
          const { activityTrackerService } = await import(
            "./activity-tracker.js"
          );
          const txHash = await activityTrackerService.recordCoinCreation(
            coin.address as `0x${string}`,
            creatorAddress as `0x${string}`,
            coin.image || "",
            coin.name,
            coin.symbol,
          );

          if (txHash) {
            console.log(`✅ Coin ${coin.symbol} recorded on-chain: ${txHash}`);
          }
        } catch (error) {
          console.error("Failed to record coin creation on-chain:", error);
          // Don't fail the request if on-chain recording fails
        }
      }

      // Send Telegram notification for coin creation (to individual users and channel)
      await sendTelegramNotification(
        creatorAddress,
        "New Coin Created! 🪙",
        `Your coin "${coin.name}" (${coin.symbol}) has been created successfully!${coin.address ? `\n\nAddress: ${coin.address}` : ""}`,
        "coin_created",
        coin,
        undefined, // Stats will be fetched if coin has an address
      );

      res.json(coin);
    } catch (error) {
      console.error("Create coin error:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return res.status(400).json({
        error: "Invalid coin data",
        details: errorMessage,
      });
    }
  });

  // Update coin
  app.patch("/api/coins/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateCoinSchema.parse(req.body);
      const coin = await storage.updateCoin(id, validatedData);
      if (!coin) {
        return res.status(404).json({ error: "Coin not found" });
      }

      // Create in-app notification when coin becomes active
      if (
        validatedData.status === "active" &&
        validatedData.address &&
        coin.creator_wallet
      ) {
        await storage.createNotification({
          userId: coin.creator_wallet,
          type: "coin_created",
          title: "🚀 Coin Deployed Successfully!",
          message: `Your coin "${coin.name}" (${coin.symbol}) is now live on the blockchain! Address: ${validatedData.address}`,
          coinAddress: validatedData.address,
          coinSymbol: coin.symbol,
          read: false,
        });

        // Also send Telegram notification
        await sendTelegramNotification(
          coin.creator_wallet,
          "🪙 Coin Deployed Successfully!",
          `Your coin "${coin.name}" (${coin.symbol}) is now live on the blockchain!\n\nAddress: ${validatedData.address}\n\n🚀 Start trading now!`,
          "coin_created",
          coin,
          undefined, // Stats will be fetched if needed
        );
      }

      res.json(coin);
    } catch (error) {
      console.error("Update coin error:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Get coin by address
  app.get("/api/coins/address/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const coin = await storage.getCoinByAddress(address);
      if (!coin) {
        return res.status(404).json({ error: "Coin not found" });
      }
      res.json(coin);
    } catch (error) {
      console.error("Get coin error:", error);
      res.status(500).json({ error: "Failed to fetch coin" });
    }
  });

  // Migrate old data endpoint
  app.post("/api/migrate", async (_req, res) => {
    try {
      const coinsResult = await migrateOldData();
      const { migrateOldRewards } = await import("./migrate-old-data");
      const rewardsResult = await migrateOldRewards();

      res.json({
        coins: coinsResult,
        rewards: rewardsResult,
        summary: {
          totalMigrated: coinsResult.count + rewardsResult.count,
          coinsCount: coinsResult.count,
          rewardsCount: rewardsResult.count,
        },
      });
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ error: "Migration failed" });
    }
  });

  // Broadcast existing coins to Telegram
  app.post("/api/telegram/broadcast-coins", async (_req, res) => {
    try {
      const coins = await storage.getAllCoins();

      if (coins.length === 0) {
        return res.json({
          success: true,
          message: "No coins to broadcast",
          broadcasted: 0,
        });
      }

      // Broadcast coins one by one with professional formatting
      let successCount = 0;
      const errors: string[] = [];

      for (const coin of coins) {
        try {
          // Only broadcast coins that have addresses (deployed coins)
          if (coin.address && coin.creator_wallet) {
            await sendTelegramNotification(
              coin.creator_wallet,
              "Coin Created",
              "",
              "coin_created",
              coin,
              undefined,
            );
            successCount++;

            // Add a small delay between broadcasts to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          const errorMsg =
            error instanceof Error ? error.message : String(error);
          errors.push(`${coin.name}: ${errorMsg}`);
          console.error(`Failed to broadcast coin ${coin.name}:`, error);
        }
      }

      res.json({
        success: true,
        message: `Broadcasted ${successCount} out of ${coins.length} coins`,
        broadcasted: successCount,
        total: coins.length,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Broadcast error:", error);
      res.status(500).json({ error: "Broadcast failed" });
    }
  });

  // Create reward endpoint (for tracking platform and trade fees)
  app.post("/api/rewards", async (req, res) => {
    try {
      const validatedData = insertReferralSchema.parse(req.body); // Assuming reward schema is similar to referral for now, adjust if different

      const {
        type,
        coinAddress,
        coinSymbol,
        transactionHash,
        rewardAmount,
        recipientAddress,
        traderAddress,
      } = validatedData;

      if (
        !type ||
        !coinAddress ||
        !coinSymbol ||
        !transactionHash ||
        !rewardAmount ||
        !recipientAddress
      ) {
        return res
          .status(400)
          .json({ error: "Missing required reward fields" });
      }

      const reward = await storage.createReward({
        type,
        coinAddress,
        coinSymbol,
        transactionHash,
        rewardAmount,
        rewardCurrency: "ZORA", // Default currency, adjust if needed
        recipientAddress,
      });

      // Record fees on-chain if activity tracker is configured
      if (traderAddress) {
        const { activityTrackerService } = await import(
          "./activity-tracker.js"
        );

        // Calculate creator and platform fees based on type
        const rewardAmountBigInt = BigInt(rewardAmount);
        let creatorFee = 0n;
        let platformFee = 0n;

        if (type === "platform") {
          platformFee = rewardAmountBigInt;
        } else if (type === "trade") {
          creatorFee = rewardAmountBigInt;
        }

        // Record to blockchain
        await activityTrackerService.recordFees(
          coinAddress as `0x${string}`,
          traderAddress as `0x${string}`,
          creatorFee,
          platformFee,
        );
      }

      // Send earnings notification to creator (for trade fees only, not platform)
      if (type === "trade" && recipientAddress) {
        // Use notification service for randomized earnings messages
        const { notificationService } = await import("./notification-service");
        await notificationService.notifyUserEarnings(recipientAddress, reward);

        // Also send trade notification
        const amount = (parseFloat(reward.rewardAmount) / 1e18).toFixed(4);
        await notificationService.notifyNewTrade(
          recipientAddress,
          reward.coinSymbol,
          'buy',
          `${amount} ${reward.rewardCurrency}`
        );
      }

      res.json(reward);
    } catch (error) {
      console.error("Create reward error:", error);
      res.status(500).json({ error: "Failed to create reward" });
    }
  });

  // Get all rewards
  app.get("/api/rewards", async (_req, res) => {
    try {
      const rewards = await storage.getAllRewards();
      res.json(rewards);
    } catch (error) {
      console.error("Get rewards error:", error);
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  });

  // Get rewards by coin
  app.get("/api/rewards/coin/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const rewards = await storage.getRewardsByCoin(address);
      res.json(rewards);
    } catch (error) {
      console.error("Get coin rewards error:", error);
      res.status(500).json({ error: "Failed to fetch coin rewards" });
    }
  });

  // Check coin's platform referral status and earnings
  app.get("/api/rewards/coin/:address/status", async (req, res) => {
    try {
      const { address } = req.params;

      // Get coin info
      const coin = await storage.getCoinByAddress(address);
      if (!coin) {
        return res.status(404).json({ error: "Coin not found" });
      }

      // Get all rewards for this coin
      const rewards = await storage.getRewardsByCoin(address);

      // Calculate earnings
      const platformFees = rewards
        .filter((r) => r.type === "platform")
        .reduce((sum, r) => sum + parseFloat(r.rewardAmount) / 1e18, 0);

      const tradeFees = rewards
        .filter((r) => r.type === "trade")
        .reduce((sum, r) => sum + parseFloat(r.rewardAmount) / 1e18, 0);

      const totalEarnings = platformFees + tradeFees;

      // Check if platform referral was likely set (has platform rewards)
      const hasPlatformReferral = rewards.some((r) => r.type === "platform");

      res.json({
        coinAddress: address,
        coinSymbol: coin.symbol,
        coinName: coin.name,
        status: coin.status,
        hasPlatformReferral,
        platformReferralAddress: hasPlatformReferral
          ? rewards.find((r) => r.type === "platform")?.recipientAddress
          : null,
        earnings: {
          total: totalEarnings,
          platform: platformFees,
          trade: tradeFees,
          currency: "ZORA",
        },
        rewardsCount: {
          total: rewards.length,
          platform: rewards.filter((r) => r.type === "platform").length,
          trade: rewards.filter((r) => r.type === "trade").length,
        },
        firstReward: rewards.length > 0 ? rewards.length - 1 : null,
        lastReward: rewards.length > 0 ? rewards[0].createdAt : null,
      });
    } catch (error) {
      console.error("Get coin status error:", error);
      res.status(500).json({ error: "Failed to fetch coin status" });
    }
  });

  // Get rewards by recipient
  app.get("/api/rewards/recipient/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const rewards = await storage.getRewardsByRecipient(address);
      res.json(rewards);
    } catch (error) {
      console.error("Get recipient rewards error:", error);
      res.status(500).json({ error: "Failed to fetch recipient rewards" });
    }
  });

  // Record a new reward (duplicate endpoint - should be consolidated)
  app.post("/api/rewards/record", async (req, res) => {
    try {
      const rewardData = {
        type: req.body.type, // 'platform' or 'trade'
        coinAddress: req.body.coinAddress,
        coinSymbol: req.body.coinSymbol,
        transactionHash: req.body.transactionHash,
        rewardAmount: req.body.rewardAmount, // In wei as string
        rewardCurrency: req.body.rewardCurrency || "ZORA",
        recipientAddress: req.body.recipientAddress,
      };

      const reward = await storage.createReward(rewardData);

      // Send earnings notification if it's a trade reward
      if (rewardData.type === "trade" && rewardData.recipientAddress) {
        const { notificationService } = await import("./notification-service");
        await notificationService.notifyUserEarnings(
          rewardData.recipientAddress,
          reward,
        );

        // Also send trade notification
        const amount = (parseFloat(reward.rewardAmount) / 1e18).toFixed(4);
        await notificationService.notifyNewTrade(
          rewardData.recipientAddress,
          reward.coinSymbol,
          'buy',
          `${amount} ${reward.rewardCurrency}`
        );
      }

      res.json(reward);
    } catch (error) {
      console.error("Create reward error:", error);
      res.status(400).json({ error: "Invalid reward data" });
    }
  });

  // Get all creators
  app.get("/api/creators", async (req, res) => {
    try {
      const creators = await storage.getAllCreators();
      res.json(creators);
    } catch (error) {
      console.error("Get creators error:", error);
      res.status(500).json({ error: "Failed to fetch creators" });
    }
  });

  // Get top creators
  app.get("/api/creators/top", async (req, res) => {
    try {
      const creators = await storage.getTopCreators();
      res.json(creators);
    } catch (error) {
      console.error("Get top creators error:", error);
      res.status(500).json({ error: "Failed to fetch top creators" });
    }
  });

  // Get creator by address
  app.get("/api/creators/address/:address", async (req, res) => {
    const { address } = req.params;
    try {
      const creator = await storage.getCreatorByAddress(address);
      if (!creator) {
        return res.status(404).json({ error: "Creator not found" });
      }
      res.json(creator);
    } catch (error: any) {
      console.error("Error fetching creator:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get creator by username
  app.get("/api/creators/username/:username", async (req, res) => {
    const { username } = req.params;
    try {
      const creators = await storage.getAllCreators();
      const creator = creators.find(
        (c) => c.name?.toLowerCase() === username.toLowerCase(),
      );
      if (!creator) {
        return res.status(404).json({ error: "Creator not found" });
      }
      res.json(creator);
    } catch (error: any) {
      console.error("Error fetching creator:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create or update creator
  app.post("/api/creators", async (req, res) => {
    try {
      const { address } = req.body;

      // Check if creator already exists
      const existingCreator = await storage.getCreatorByAddress(address);
      if (existingCreator) {
        return res.json(existingCreator);
      }

      // Create new creator with username as referral code
      const referralCode = await getReferralCodeFromUsername(
        req.body.name || null,
        req.body.address,
      );
      const creatorData = {
        address: req.body.address,
        name: req.body.name || null,
        bio: req.body.bio || null,
        avatar: req.body.avatar || null,
        verified: req.body.verified || "false",
        totalCoins: req.body.totalCoins || "0",
        totalVolume: req.body.totalVolume || "0",
        followers: req.body.followers || "0",
        referralCode: referralCode,
      };

      const creator = await storage.createCreator(creatorData);
      res.json(creator);
    } catch (error) {
      console.error("Create creator error:", error);
      res.status(400).json({ error: "Invalid creator data" });
    }
  });

  // Update creator
  app.patch("/api/creators/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData: any = {
        name: req.body.name,
        bio: req.body.bio,
        avatar: req.body.avatar,
        verified: req.body.verified,
        totalCoins: req.body.totalCoins,
        totalVolume: req.body.totalVolume,
        followers: req.body.followers,
      };

      // If name is being updated, also update the referral code to match username
      if (req.body.name !== undefined) {
        const creator = await storage.getCreator(id);
        if (creator) {
          const newReferralCode = await getReferralCodeFromUsername(
            req.body.name,
            creator.address,
          );
          updateData.referralCode = newReferralCode;
        }
      }

      const creator = await storage.updateCreator(id, updateData);
      if (!creator) {
        return res.status(404).json({ error: "Creator not found" });
      }
      res.json(creator);
    } catch (error) {
      console.error("Update creator error:", error);
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Get all comments
  app.get("/api/comments", async (_req, res) => {
    try {
      const comments = await storage.getAllComments();
      res.json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Get comments by coin address
  app.get("/api/comments/coin/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const comments = await storage.getCommentsByCoin(address);
      res.json(comments);
    } catch (error) {
      console.error("Get coin comments error:", error);
      res.status(500).json({ error: "Failed to fetch coin comments" });
    }
  });

  // Create a comment
  app.post("/api/comments", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validatedData);
      res.json(comment);
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(400).json({ error: "Invalid comment data" });
    }
  });

  // Get notifications for user
  app.get("/api/notifications/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Get unread notifications for user
  app.get("/api/notifications/:userId/unread", async (req, res) => {
    try {
      const { userId } = req.params;
      const notifications = await storage.getUnreadNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Get unread notifications error:", error);
      res.status(500).json({ error: "Failed to fetch unread notifications" });
    }
  });

  // Create notification
  app.post("/api/notifications", async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);

      // Send Telegram notification if available
      await sendTelegramNotification(
        notification.userId,
        notification.title,
        notification.message,
        notification.type,
      );

      res.json(notification);
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(400).json({ error: "Invalid notification data" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      if (!notification) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json(notification);
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/:userId/read-all", async (req, res) => {
    try {
      const { userId } = req.params;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res
        .status(500)
        .json({ error: "Failed to mark all notifications as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteNotification(id);
      if (!deleted) {
        return res.status(404).json({ error: "Notification not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // Registry endpoints for onchain verification
  const registryService = new RegistryService(base.id);

  // Activity Tracker endpoints for grant verification
  const activityTrackerService = new ActivityTrackerService(base.id);

  // Manually trigger batch registration of unregistered coins
  app.post("/api/registry/sync", async (_req, res) => {
    try {
      const coins = await storage.getAllCoins();
      const unregisteredCoins = coins.filter(
        (coin) =>
          coin.address && coin.status === "active" && !coin.registryTxHash,
      );

      if (unregisteredCoins.length === 0) {
        return res.json({
          message: "No coins to register",
          registered: 0,
        });
      }

      const txHash =
        await registryService.registerCoinsBatch(unregisteredCoins);

      if (txHash) {
        const now = new Date();
        for (const coin of unregisteredCoins) {
          const metadataHash = registryService.generateMetadataHash(coin);
          await storage.updateCoin(coin.id, {
            registryTxHash: txHash,
            metadataHash,
            registeredAt: now,
          });
        }

        return res.json({
          success: true,
          transactionHash: txHash,
          registered: unregisteredCoins.length,
        });
      } else {
        return res.status(500).json({
          error: "Failed to register coins batch",
        });
      }
    } catch (error) {
      console.error("Registry sync error:", error);
      res.status(500).json({ error: "Failed to sync registry" });
    }
  });

  // Get registry statistics
  app.get("/api/registry/stats", async (_req, res) => {
    try {
      const totalRegistered = await registryService.getTotalCoinsRegistered();
      const allCoins = await storage.getAllCoins();
      const registeredInDb = allCoins.filter((c) => c.registryTxHash).length;
      const pendingRegistration = allCoins.filter(
        (c) => c.address && c.status === "active" && !c.registryTxHash,
      ).length;

      res.json({
        totalOnchain: totalRegistered,
        totalInDb: allCoins.length,
        registeredInDb,
        pendingRegistration,
      });
    } catch (error) {
      console.error("Registry stats error:", error);
      res.status(500).json({ error: "Failed to fetch registry stats" });
    }
  });

  // Manually trigger batch recording of unrecorded coins to activity tracker
  app.post("/api/activity-tracker/sync", async (_req, res) => {
    try {
      const coins = await storage.getAllCoins();
      const unrecordedCoins = coins.filter(
        (coin) =>
          coin.address &&
          coin.status === "active" &&
          !coin.activityTrackerTxHash,
      );

      if (unrecordedCoins.length === 0) {
        return res.json({
          success: true,
          message: "No coins to record on activity tracker",
          recorded: 0,
          alreadyRegistered: 0,
        });
      }

      // Ensure all coins have a createdAt timestamp
      for (const coin of unrecordedCoins) {
        if (!coin.createdAt) {
          // Set a reasonable past date for coins without creation dates
          const fallbackDate = new Date("2025-01-01T00:00:00Z");
          await storage.updateCoin(coin.id, {
            createdAt: fallbackDate,
          });
          coin.createdAt = fallbackDate;
          console.log(
            `✅ Set fallback createdAt for ${coin.symbol}: ${fallbackDate.toISOString()}`,
          );
        }
      }

      const results =
        await activityTrackerService.recordCoinBatch(unrecordedCoins);

      const now = new Date();
      let newlyRecorded = 0;
      let alreadyRegistered = 0;
      const failedCoins: string[] = [];

      for (const [coinId, txHash] of results.entries()) {
        await storage.updateCoin(coinId, {
          activityTrackerTxHash: txHash,
          activityTrackerRecordedAt: now,
        });

        // Check if this was already registered (txHash equals coin address)
        const coin = unrecordedCoins.find((c) => c.id === coinId);
        if (coin && txHash === coin.address) {
          alreadyRegistered++;
        } else {
          newlyRecorded++;
        }
      }

      // Track failed coins
      for (const coin of unrecordedCoins) {
        if (!results.has(coin.id)) {
          failedCoins.push(`${coin.symbol} (${coin.address})`);
        }
      }

      const response: any = {
        success: true,
        message: `Processed ${unrecordedCoins.length} coins: ${newlyRecorded} newly recorded, ${alreadyRegistered} already on-chain, ${failedCoins.length} failed`,
        recorded: newlyRecorded,
        alreadyRegistered: alreadyRegistered,
        failed: failedCoins.length,
        total: unrecordedCoins.length,
        transactionHashes: Array.from(results.values()).filter(
          (h) => h.startsWith("0x") && h.length > 42,
        ),
      };

      if (failedCoins.length > 0) {
        response.failedCoins = failedCoins;
        response.troubleshooting = [
          "Check console logs for detailed error messages",
          "Verify PLATFORM_PRIVATE_KEY has sufficient ETH for gas",
          "Ensure VITE_ACTIVITY_TRACKER_ADDRESS is correct",
          "Some coins may already be registered on-chain",
        ];
      }

      return res.json(response);
    } catch (error) {
      console.error("Activity tracker sync error:", error);
      res.status(500).json({ error: "Failed to sync activity tracker" });
    }
  });

  // Get activity tracker statistics
  app.get("/api/activity-tracker/stats", async (_req, res) => {
    try {
      const allCoins = await storage.getAllCoins();
      const recordedInDb = allCoins.filter(
        (c) => c.activityTrackerTxHash,
      ).length;
      const pendingRecording = allCoins.filter(
        (c) => c.address && c.status === "active" && !c.activityTrackerTxHash,
      ).length;

      res.json({
        totalInDb: allCoins.length,
        recordedInDb,
        pendingRecording,
      });
    } catch (error) {
      console.error("Activity tracker stats error:", error);
      res.status(500).json({ error: "Failed to fetch activity tracker stats" });
    }
  });

  // Broadcast all existing coins to Telegram
  app.post("/api/telegram/broadcast-coins", async (_req, res) => {
    try {
      const { broadcastExistingCoins } = await import("./telegram-bot");
      const coins = await storage.getAllCoins();
      await broadcastExistingCoins(coins);

      res.json({
        success: true,
        message: `Broadcasting ${coins.length} coins to connected Telegram users`,
      });
    } catch (error) {
      console.error("Telegram broadcast error:", error);
      res.status(500).json({ error: "Failed to broadcast coins" });
    }
  });

  // Verify if a coin is registered onchain
  app.get("/api/registry/verify/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const isRegistered = await registryService.isPlatformCoin(address);

      const coin = await storage.getCoinByAddress(address);

      res.json({
        address,
        isRegistered,
        registryTxHash: coin?.registryTxHash || null,
        registeredAt: coin?.registeredAt || null,
      });
    } catch (error) {
      console.error("Registry verify error:", error);
      res.status(500).json({ error: "Failed to verify coin" });
    }
  });

  // Get creator coin count from registry
  app.get("/api/registry/creator/:address/count", async (req, res) => {
    try {
      const { address } = req.params;
      const count = await registryService.getCreatorCoinCount(address);

      res.json({
        creator: address,
        onchainCoinCount: count,
      });
    } catch (error) {
      console.error("Registry creator count error:", error);
      res.status(500).json({ error: "Failed to fetch creator coin count" });
    }
  });

  // ===== FOLLOW/UNFOLLOW ENDPOINTS =====

  // Follow a user
  app.post("/api/follows", async (req, res) => {
    try {
      const validatedData = insertFollowSchema.parse(req.body);

      // Check if already following
      const isFollowing = await storage.isFollowing(
        validatedData.followerAddress,
        validatedData.followingAddress,
      );
      if (isFollowing) {
        return res.status(400).json({ error: "Already following this user" });
      }

      const follow = await storage.createFollow(validatedData);

      // Update follower count for the followed user
      const creator = await storage.getCreatorByAddress(
        validatedData.followingAddress,
      );
      if (creator) {
        const currentFollowers = parseInt(creator.followers || "0");
        await storage.updateCreator(creator.id, {
          followers: (currentFollowers + 1).toString(),
        });
      }

      res.json(follow);
    } catch (error) {
      console.error("Create follow error:", error);
      res.status(400).json({ error: "Failed to follow user" });
    }
  });

  // Unfollow a user
  app.delete(
    "/api/follows/:followerAddress/:followingAddress",
    async (req, res) => {
      try {
        const { followerAddress, followingAddress } = req.params;
        const deleted = await storage.deleteFollow(
          followerAddress,
          followingAddress,
        );

        if (deleted) {
          // Update follower count for the unfollowed user
          const creator = await storage.getCreatorByAddress(followingAddress);
          if (creator) {
            const currentFollowers = parseInt(creator.followers || "0");
            await storage.updateCreator(creator.id, {
              followers: Math.max(0, currentFollowers - 1).toString(),
            });
          }
        }

        res.json({ success: deleted });
      } catch (error) {
        console.error("Delete follow error:", error);
        res.status(500).json({ error: "Failed to unfollow user" });
      }
    },
  );

  // Check if following
  app.get(
    "/api/follows/check/:followerAddress/:followingAddress",
    async (req, res) => {
      try {
        const { followerAddress, followingAddress } = req.params;
        const isFollowing = await storage.isFollowing(
          followerAddress,
          followingAddress,
        );
        res.json({ isFollowing });
      } catch (error) {
        console.error("Check follow error:", error);
        res.status(500).json({ error: "Failed to check follow status" });
      }
    },
  );

  // Get followers of a user
  app.get("/api/follows/followers/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const followers = await storage.getFollowers(address);
      res.json(followers);
    } catch (error) {
      console.error("Get followers error:", error);
      res.status(500).json({ error: "Failed to get followers" });
    }
  });

  // Get users that a user is following
  app.get("/api/follows/following/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const following = await storage.getFollowing(address);
      res.json(following);
    } catch (error) {
      console.error("Get following error:", error);
      res.status(500).json({ error: "Failed to get following" });
    }
  });

  // ===== REFERRAL ENDPOINTS =====

  // Helper function to get referral code from username
  async function getReferralCodeFromUsername(
    name: string | null,
    address: string,
  ): Promise<string> {
    // Use username if available, otherwise use shortened wallet address (without 0x prefix)
    const referralCode = name || address.slice(2, 10); // Remove 0x and take first 8 chars

    console.log(
      `Using referral code: ${referralCode} for address: ${address.slice(0, 8)}...`,
    );
    return referralCode;
  }

  // Generate referral link
  app.post("/api/referrals/generate", async (req, res) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      // Get or create creator
      let creator = await storage.getCreatorByAddress(address);
      if (!creator) {
        creator = await storage.createCreator({
          address: address,
          name: null,
          bio: null,
          avatar: null,
          verified: "false",
          totalCoins: "0",
          totalVolume: "0",
          followers: "0",
          referralCode: null,
          points: "0",
        });
      }

      // Set referral code based on username or address
      const referralCode = await getReferralCodeFromUsername(
        creator.name,
        address,
      );

      // Update if referral code changed or is null
      if (!creator.referralCode || creator.referralCode !== referralCode) {
        const updated = await storage.updateCreator(creator.id, {
          referralCode,
        });
        if (updated) {
          creator = updated;
        }
      }

      // Ensure we have a valid referral code
      const finalReferralCode = creator.referralCode || referralCode;

      // Use the actual host from the request
      const host = req.get("host") || "localhost:5000";
      const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
      const referralLink = `${protocol}://${host}/?ref=${finalReferralCode}`;

      console.log(`Generated referral link: ${referralLink}`);

      res.json({
        referralCode: finalReferralCode,
        referralLink,
      });
    } catch (error) {
      console.error("Generate referral error:", error);
      res.status(500).json({ error: "Failed to generate referral link" });
    }
  });

  // Apply referral (when a new user signs up with a referral code)
  app.post("/api/referrals/apply", async (req, res) => {
    try {
      const validatedData = insertReferralSchema.parse(req.body);

      // Check if referral already exists
      const existing = await storage.getReferralByAddresses(
        validatedData.referrerAddress,
        validatedData.referredAddress,
      );

      if (existing) {
        return res.status(400).json({ error: "Referral already exists" });
      }

      // Check if user is trying to refer themselves
      if (
        validatedData.referrerAddress.toLowerCase() ===
        validatedData.referredAddress.toLowerCase()
      ) {
        return res.status(400).json({ error: "Cannot refer yourself" });
      }

      // Create referral
      const referral = await storage.createReferral(validatedData);

      // Update referrer's points
      const referrer = await storage.getCreatorByAddress(
        validatedData.referrerAddress,
      );
      const pointsToAdd = parseInt(validatedData.pointsEarned || "100");

      if (referrer) {
        const currentPoints = parseInt(referrer.points || "0");
        await storage.updateCreator(referrer.id, {
          points: (currentPoints + pointsToAdd).toString(),
        });
      }

      // Get referred user info
      const referredUser = await storage.getCreatorByAddress(
        validatedData.referredAddress,
      );
      const referredName =
        referredUser?.name ||
        `${validatedData.referredAddress.slice(0, 6)}...${validatedData.referredAddress.slice(-4)}`;
      const referrerName =
        referrer?.name ||
        `${validatedData.referrerAddress.slice(0, 6)}...${validatedData.referrerAddress.slice(-4)}`;

      // Send notification to REFERRER (they earned points)
      await storage.createNotification({
        userId: validatedData.referrerAddress,
        type: "reward",
        title: "Referral Successful! 🎉",
        message: `${referredName} joined using your referral link! You earned ${pointsToAdd} points.`,
        read: false,
      });

      // Send Telegram notification to referrer
      await sendTelegramNotification(
        validatedData.referrerAddress,
        "Referral Successful! 🎉",
        `${referredName} joined using your referral link! You earned ${pointsToAdd} points.`,
        "reward",
      );

      // Send notification to REFERRED USER (welcoming them)
      await storage.createNotification({
        userId: validatedData.referredAddress,
        type: "reward",
        title: "Welcome to CoinIT! 🚀",
        message: `You joined via ${referrerName}'s referral link. Start creating and trading coins now!`,
        read: false,
      });

      // Send Telegram notification to referred user
      await sendTelegramNotification(
        validatedData.referredAddress,
        "Welcome to CoinIT! 🚀",
        `You joined via ${referrerName}'s referral link. Start creating and trading coins now!`,
        "reward",
      );

      res.json(referral);
    } catch (error) {
      console.error("Apply referral error:", error);
      res.status(400).json({ error: "Failed to apply referral" });
    }
  });

  // Get referrals by referrer
  app.get("/api/referrals/referrer/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const referrals = await storage.getReferralsByReferrer(address);
      res.json(referrals);
    } catch (error) {
      console.error("Get referrals error:", error);
      res.status(500).json({ error: "Failed to get referrals" });
    }
  });

  // Get referrals by code
  app.get("/api/referrals/code/:code", async (req, res) => {
    try {
      const { code } = req.params;
      const referrals = await storage.getReferralsByCode(code);
      res.json(referrals);
    } catch (error) {
      console.error("Get referrals by code error:", error);
      res.status(500).json({ error: "Failed to get referrals" });
    }
  });

  // Get referral stats for a user
  app.get("/api/referrals/stats/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const referrals = await storage.getReferralsByReferrer(address);
      const creator = await storage.getCreatorByAddress(address);

      const totalPoints = parseInt(creator?.points || "0");
      const totalReferrals = referrals.length;

      res.json({
        totalPoints,
        totalReferrals,
        referrals,
      });
    } catch (error) {
      console.error("Get referral stats error:", error);
      res.status(500).json({ error: "Failed to get referral stats" });
    }
  });

  // Push notification subscription
  app.post("/api/push-subscriptions", async (req, res) => {
    try {
      const { userAddress, subscription } = req.body;

      if (!userAddress || !subscription) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Store subscription in database
      await storage.createPushSubscription({
        userAddress,
        subscription: JSON.stringify(subscription),
        endpoint: subscription.endpoint,
      });

      res.json({ success: true, message: "Push subscription saved" });
    } catch (error) {
      console.error("Push subscription error:", error);
      res.status(500).json({ error: "Failed to save push subscription" });
    }
  });

  // Get login streak for a user
  app.get("/api/login-streak/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const loginStreak = await storage.getLoginStreak(address);
      res.json(loginStreak || null);
    } catch (error) {
      console.error("Get login streak error:", error);
      res.status(500).json({ error: "Failed to get login streak" });
    }
  });

  // Check for unclaimed daily points and send reminder
  app.post("/api/login-streak/check-unclaimed", async (req, res) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      const today = new Date().toISOString().split("T")[0];
      const loginStreak = await storage.getLoginStreak(address);

      // If no streak exists, user hasn't claimed their first points
      if (!loginStreak) {
        await storage.createNotification({
          userId: address,
          type: "reward",
          title: "🎁 Claim Your Welcome Bonus!",
          message:
            "You have 10 points waiting for you! Visit the app to claim your first daily login bonus and start your streak.",
          amount: "10",
          read: false,
        });

        await sendTelegramNotification(
          address,
          "🎁 Claim Your Welcome Bonus!",
          "You have 10 points waiting! Visit the app to claim your first daily login bonus and start your streak 🔥",
          "reward",
        );

        return res.json({
          hasUnclaimed: true,
          pointsAvailable: 10,
          isFirstTime: true,
        });
      }

      // If last login was not today, user has unclaimed points
      if (loginStreak.lastLoginDate !== today) {
        const lastLogin = new Date(loginStreak.lastLoginDate || today);
        const todayDate = new Date(today);
        const daysDiff = Math.floor(
          (todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24),
        );

        let currentStreak = parseInt(loginStreak.currentStreak || "0");
        let pointsAvailable = 10;
        let streakStatus = "";

        if (daysDiff === 1) {
          // Can continue streak
          const nextStreak = currentStreak + 1;
          pointsAvailable = 10 + Math.min(Math.floor(nextStreak / 7) * 5, 50);
          streakStatus = `Continue your ${currentStreak} day streak`;
        } else {
          // Streak will reset
          pointsAvailable = 10;
          streakStatus = `Your ${currentStreak} day streak will reset`;
        }

        await storage.createNotification({
          userId: address,
          type: "reward",
          title: "🔥 Daily Points Available!",
          message: `${streakStatus}! Claim ${pointsAvailable} points now by visiting the app. Don't miss out!`,
          amount: pointsAvailable.toString(),
          read: false,
        });

        await sendTelegramNotification(
          address,
          "🔥 Daily Points Available!",
          `${streakStatus}! Claim ${pointsAvailable} points now 🎁`,
          "reward",
        );

        return res.json({
          hasUnclaimed: true,
          pointsAvailable,
          currentStreak,
          willReset: daysDiff > 1,
        });
      }

      res.json({ hasUnclaimed: false });
    } catch (error) {
      console.error("Check unclaimed error:", error);
      res.status(500).json({ error: "Failed to check unclaimed points" });
    }
  });

  // Check and record daily login
  app.post("/api/login-streak/check-in", async (req, res) => {
    try {
      const { address } = req.body;

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      const today = new Date().toISOString().split("T")[0];
      let loginStreak = await storage.getLoginStreak(address);

      if (!loginStreak) {
        loginStreak = await storage.createLoginStreak({
          userAddress: address,
          currentStreak: "1",
          longestStreak: "1",
          lastLoginDate: today,
          totalPoints: "10",
          loginDates: [today],
        });

        let creator = await storage.getCreatorByAddress(address);
        if (!creator) {
          creator = await storage.createCreator({
            address,
            points: "10",
          });
        } else {
          const newPoints = (parseInt(creator.points || "0") + 10).toString();
          await storage.updateCreator(creator.id, { points: newPoints });
        }

        // Create notification for first login - CLAIMED
        await storage.createNotification({
          userId: address,
          type: "reward",
          title: "🎉 Welcome Bonus Claimed!",
          message:
            "Congratulations! You claimed 10 points for your first daily login. Come back tomorrow to continue your streak!",
          amount: "10",
          read: false,
        });

        // Send Telegram notification
        await sendTelegramNotification(
          address,
          "🎉 Welcome Bonus Claimed!",
          "You earned 10 points for your first login! Come back daily to build your streak 🔥",
          "reward",
        );

        return res.json({
          streak: loginStreak,
          pointsEarned: 10,
          isFirstLogin: true,
        });
      }

      if (loginStreak.lastLoginDate === today) {
        return res.json({
          streak: loginStreak,
          pointsEarned: 0,
          alreadyCheckedIn: true,
        });
      }

      const lastLogin = new Date(loginStreak.lastLoginDate || today);
      const todayDate = new Date(today);
      const daysDiff = Math.floor(
        (todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24),
      );

      let newStreak = parseInt(loginStreak.currentStreak || "0");
      let pointsEarned = 10;
      let isNewStreak = false;

      if (daysDiff === 1) {
        newStreak += 1;
        pointsEarned = 10 + Math.min(Math.floor(newStreak / 7) * 5, 50);
      } else {
        newStreak = 1;
        pointsEarned = 10;
        isNewStreak = true;
      }

      const newLongestStreak = Math.max(
        newStreak,
        parseInt(loginStreak.longestStreak || "0"),
      ).toString();
      const loginDates = [...(loginStreak.loginDates || []), today];
      const newTotalPoints = (
        parseInt(loginStreak.totalPoints || "0") + pointsEarned
      ).toString();

      const updatedStreak = await storage.updateLoginStreak(address, {
        currentStreak: newStreak.toString(),
        longestStreak: newLongestStreak,
        lastLoginDate: today,
        totalPoints: newTotalPoints,
        loginDates,
      });

      let creator = await storage.getCreatorByAddress(address);
      if (!creator) {
        creator = await storage.createCreator({
          address,
          points: pointsEarned.toString(),
        });
      } else {
        const newPoints = (
          parseInt(creator.points || "0") + pointsEarned
        ).toString();
        await storage.updateCreator(creator.id, { points: newPoints });
      }

      // Create notification for daily check-in - CLAIMED
      let notificationMessage = "";
      let notificationTitle = "";

      if (isNewStreak) {
        notificationTitle = "🔥 Daily Points Claimed!";
        notificationMessage = `Your streak was reset, but you claimed ${pointsEarned} points! Login daily to build up bonus points and longer streaks.`;
      } else if (newStreak >= 7) {
        const bonusPoints = pointsEarned - 10;
        notificationTitle = `🔥 ${newStreak} Day Streak - ${pointsEarned} Points Claimed!`;
        notificationMessage = `Amazing! You've claimed ${pointsEarned} points (10 base + ${bonusPoints} streak bonus) for ${newStreak} consecutive days! Keep it going!`;
      } else {
        notificationTitle = `🔥 Day ${newStreak} Streak - ${pointsEarned} Points Claimed!`;
        notificationMessage = `Great! You claimed ${pointsEarned} points for day ${newStreak} of your streak. ${7 - newStreak} more days to unlock bonus points!`;
      }

      // Check if this is a new personal record
      if (
        newStreak.toString() === newLongestStreak &&
        newStreak > parseInt(loginStreak.longestStreak || "0")
      ) {
        notificationTitle = `🏆 New Record! ${newStreak} Day Streak - ${pointsEarned} Points!`;
        notificationMessage = `Congratulations! You've set a new personal record and claimed ${pointsEarned} points for your ${newStreak} day login streak! You're unstoppable! 🚀`;
      }

      await storage.createNotification({
        userId: address,
        type: "reward",
        title: notificationTitle,
        message: notificationMessage,
        amount: pointsEarned.toString(),
        read: false,
      });

      // Send Telegram notification
      await sendTelegramNotification(
        address,
        notificationTitle,
        notificationMessage,
        "reward",
      );

      res.json({
        streak: updatedStreak,
        pointsEarned,
        isNewStreak: daysDiff !== 1,
      });
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ error: "Failed to check in" });
    }
  });

  // Get activity events from blockchain
  app.get("/api/blockchain/activity-events", async (req, res) => {
    try {
      const { activityTrackerService } = await import("./activity-tracker.js");
      const fromBlock = req.query.fromBlock
        ? BigInt(req.query.fromBlock as string)
        : 0n;
      const events = await activityTrackerService.getActivityEvents(fromBlock);

      res.json({
        success: true,
        events: events.map((log) => ({
          blockNumber: log.blockNumber?.toString(),
          transactionHash: log.transactionHash,
          args: log.args,
        })),
      });
    } catch (error) {
      console.error("Get activity events error:", error);
      res.status(500).json({ error: "Failed to get activity events" });
    }
  });

  // Blockchain metrics endpoints
  app.get("/api/blockchain/platform-stats", async (_req, res) => {
    try {
      const { activityTrackerService } = await import("./activity-tracker.js");
      const stats = await activityTrackerService.getPlatformStats();

      if (!stats) {
        return res.json({
          totalCoins: 0,
          totalPlatformFees: "0",
          totalCreatorFees: "0",
          totalVolume: "0",
          totalCreators: 0,
        });
      }

      res.json({
        totalCoins: stats.totalCoins.toString(),
        totalPlatformFees: stats.totalPlatformFees.toString(),
        totalCreatorFees: stats.totalCreatorFees.toString(),
        totalVolume: stats.totalVolume.toString(),
        totalCreators: stats.totalCreators.toString(),
      });
    } catch (error) {
      console.error("Get platform stats error:", error);
      res.status(500).json({ error: "Failed to get platform stats" });
    }
  });

  app.get("/api/blockchain/coin-metrics/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const { activityTrackerService } = await import("./activity-tracker.js");
      const metrics = await activityTrackerService.getCoinMetrics(
        address as `0x${string}`,
      );

      if (!metrics) {
        return res.json({
          totalCreatorFees: "0",
          totalPlatformFees: "0",
          currentMarketCap: "0",
          totalVolume: "0",
          tradeCount: "0",
          lastUpdated: "0",
        });
      }

      res.json({
        totalCreatorFees: metrics.totalCreatorFees.toString(),
        totalPlatformFees: metrics.totalPlatformFees.toString(),
        currentMarketCap: metrics.currentMarketCap.toString(),
        totalVolume: metrics.totalVolume.toString(),
        tradeCount: metrics.tradeCount.toString(),
        lastUpdated: metrics.lastUpdated.toString(),
      });
    } catch (error) {
      console.error("Get coin metrics error:", error);
      res.status(500).json({ error: "Failed to get coin metrics" });
    }
  });

  app.get("/api/blockchain/creator-stats/:address", async (req, res) => {
    try {
      const { address } = req.params;
      const { activityTrackerService } = await import("./activity-tracker.js");
      const stats = await activityTrackerService.getCreatorStats(
        address as `0x${string}`,
      );

      if (!stats) {
        return res.json({
          coinsCreated: "0",
          totalFeesEarned: "0",
        });
      }

      res.json({
        coinsCreated: stats.coinsCreated.toString(),
        totalFeesEarned: stats.totalFeesEarned.toString(),
      });
    } catch (error) {
      console.error("Get creator stats error:", error);
      res.status(500).json({ error: "Failed to get creator stats" });
    }
  });

  // === NOTIFICATION SERVICE ENDPOINTS ===

  // Send test notification
  app.post("/api/notifications/send-test", async (req, res) => {
    try {
      const { type, title, message, address } = req.body;

      if (address === "all") {
        // Send to all users
        const creators = await storage.getAllCreators();
        for (const creator of creators) {
          await storage.createNotification({
            userId: creator.address,
            type: type,
            title: title,
            message: message,
            read: false,
          });

          await sendTelegramNotification(creator.address, title, message, type);
        }
      } else if (address) {
        // Send to specific user
        await storage.createNotification({
          userId: address,
          type: type,
          title: title,
          message: message,
          read: false,
        });

        await sendTelegramNotification(address, title, message, type);
      }

      res.json({ success: true, message: "Test notification sent" });
    } catch (error) {
      console.error("Send test notification error:", error);
      res.status(500).json({ error: "Failed to send test notification" });
    }
  });

  // Send all periodic notifications (top creators, earners, coins, points, trades)
  app.post("/api/notifications/send-all", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendAllPeriodicNotifications();
      res.json({ success: true, message: "All periodic notifications sent" });
    } catch (error) {
      console.error("Send all notifications error:", error);
      res.status(500).json({ error: "Failed to send notifications" });
    }
  });

  // Send top creators notification
  app.post("/api/notifications/top-creators", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendTopCreatorsNotification();
      res.json({ success: true, message: "Top creators notification sent" });
    } catch (error) {
      console.error("Send top creators notification error:", error);
      res
        .status(500)
        .json({ error: "Failed to send top creators notification" });
    }
  });

  // Send top earners notification
  app.post("/api/notifications/top-earners", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendTopEarnersNotification(24);
      res.json({ success: true, message: "Top earners notification sent" });
    } catch (error) {
      console.error("Send top earners notification error:", error);
      res
        .status(500)
        .json({ error: "Failed to send top earners notification" });
    }
  });

  // Send top coins notification
  app.post("/api/notifications/top-coins", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendTopCoinsNotification();
      res.json({ success: true, message: "Top coins notification sent" });
    } catch (error) {
      console.error("Send top coins notification error:", error);
      res.status(500).json({ error: "Failed to send top coins notification" });
    }
  });

  // Send trending coins notification
  app.post("/api/notifications/trending-coins", async (_req, res) => {
    try {
      const { checkAndNotifyTrendingCoins } = await import(
        "./trending-notifications"
      );
      await checkAndNotifyTrendingCoins();
      res.json({ success: true, message: "Trending coins notification sent" });
    } catch (error) {
      console.error("Send trending coins notification error:", error);
      res
        .status(500)
        .json({ error: "Failed to send trending coins notification" });
    }
  });

  // Send recent trades notification
  app.post("/api/notifications/recent-trades", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendRecentTradesNotification();
      res.json({ success: true, message: "Recent trades notification sent" });
    } catch (error) {
      console.error("Send recent trades notification error:", error);
      res
        .status(500)
        .json({ error: "Failed to send recent trades notification" });
    }
  });

  // Remind users about unclaimed daily points
  app.post("/api/notifications/remind-unclaimed-points", async (_req, res) => {
    try {
      const creators = await storage.getAllCreators();
      const today = new Date().toISOString().split("T")[0];
      let reminderCount = 0;

      for (const creator of creators) {
        const loginStreak = await storage.getLoginStreak(creator.address);

        if (!loginStreak || loginStreak.lastLoginDate !== today) {
          const pointsAvailable = loginStreak
            ? 10 +
              Math.min(
                Math.floor(
                  (parseInt(loginStreak.currentStreak || "0") + 1) / 7,
                ) * 5,
                50,
              )
            : 10;

          await storage.createNotification({
            userId: creator.address,
            type: "reward",
            title: "🎁 Don't Forget Your Daily E1XP!",
            message: `You have ${pointsAvailable} E1XP points waiting to be claimed! Visit the app now to keep your streak alive.`,
            amount: pointsAvailable.toString(),
            read: false,
          });
          reminderCount++;
        }
      }

      res.json({
        success: true,
        message: `Sent ${reminderCount} unclaimed points reminders`,
      });
    } catch (error) {
      console.error("Send unclaimed points reminder error:", error);
      res
        .status(500)
        .json({ error: "Failed to send unclaimed points reminders" });
    }
  });

  // Warn users about streak reset
  app.post("/api/notifications/remind-streak-reset", async (_req, res) => {
    try {
      const creators = await storage.getAllCreators();
      const today = new Date().toISOString().split("T")[0];
      let warningCount = 0;

      for (const creator of creators) {
        const loginStreak = await storage.getLoginStreak(creator.address);

        if (loginStreak && loginStreak.lastLoginDate !== today) {
          const lastLogin = new Date(loginStreak.lastLoginDate);
          const todayDate = new Date(today);
          const daysDiff = Math.floor(
            (todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24),
          );

          if (
            daysDiff === 1 &&
            parseInt(loginStreak.currentStreak || "0") > 3
          ) {
            await storage.createNotification({
              userId: creator.address,
              type: "reward",
              title: "⚠️ Your Streak Is About To Reset!",
              message: `Your ${loginStreak.currentStreak} day streak will reset at midnight! Claim your daily E1XP now to keep it going.`,
              read: false,
            });
            warningCount++;
          }
        }
      }

      res.json({
        success: true,
        message: `Sent ${warningCount} streak reset warnings`,
      });
    } catch (error) {
      console.error("Send streak reset warning error:", error);
      res.status(500).json({ error: "Failed to send streak reset warnings" });
    }
  });

  // Welcome new users
  app.post("/api/notifications/welcome-new-users", async (_req, res) => {
    try {
      const creators = await storage.getAllCreators();
      let welcomeCount = 0;

      for (const creator of creators) {
        const loginStreak = await storage.getLoginStreak(creator.address);

        if (!loginStreak) {
          await storage.createNotification({
            userId: creator.address,
            type: "reward",
            title: "🎉 Welcome to the Platform!",
            message:
              "Claim your 10 E1XP welcome bonus now! Start your daily login streak and earn even more points.",
            amount: "10",
            read: false,
          });
          welcomeCount++;
        }
      }

      res.json({
        success: true,
        message: `Sent ${welcomeCount} welcome notifications`,
      });
    } catch (error) {
      console.error("Send welcome notifications error:", error);
      res.status(500).json({ error: "Failed to send welcome notifications" });
    }
  });

  // Promote new coins
  app.post("/api/notifications/promote-new-coins", async (_req, res) => {
    try {
      const coins = await storage.getAllCoins();
      const recentCoins = coins
        .filter((c) => c.status === "active" && c.address)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5);

      if (recentCoins.length === 0) {
        return res.json({ success: true, message: "No new coins to promote" });
      }

      const creators = await storage.getAllCreators();
      let notificationCount = 0;

      for (const creator of creators) {
        const coinsList = recentCoins.map((c) => c.symbol).join(", ");

        await storage.createNotification({
          userId: creator.address,
          type: "coin_created",
          title: "🚀 Fresh Coins Just Dropped!",
          message: `Check out these new coins: ${coinsList}. Trade early and earn rewards!`,
          read: false,
        });
        notificationCount++;
      }

      res.json({
        success: true,
        message: `Promoted ${recentCoins.length} coins to ${notificationCount} users`,
      });
    } catch (error) {
      console.error("Promote new coins error:", error);
      res.status(500).json({ error: "Failed to promote new coins" });
    }
  });

  // Register Zora explore routes
  const { registerZoraExploreRoutes } = await import("./routes/zora-explore");
  registerZoraExploreRoutes(app);

  // Continue with existing code
  app.post("/api/notifications/top-creators", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendTopCreatorsNotification();
      res.json({ success: true, message: "Top creators notification sent" });
    } catch (error) {
      console.error("Send top creators notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Send top earners notification (with optional time period)
  app.post("/api/notifications/top-earners", async (req, res) => {
    try {
      const hours = parseInt(req.body.hours) || undefined; // 10, 24, 72, etc.
      const { notificationService } = await import("./notification-service");
      await notificationService.sendTopEarnersNotification(hours);
      res.json({
        success: true,
        message: `Top earners notification sent${hours ? ` for ${hours}h` : ""}`,
      });
    } catch (error) {
      console.error("Send top earners notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Send top coins notification
  app.post("/api/notifications/top-coins", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendTopCoinsNotification();
      res.json({ success: true, message: "Top coins notification sent" });
    } catch (error) {
      console.error("Send top coins notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Send top points earners notification
  app.post("/api/notifications/top-points", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendTopPointsNotification();
      res.json({ success: true, message: "Top points notification sent" });
    } catch (error) {
      console.error("Send top points notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Send recent trades notification
  app.post("/api/notifications/recent-trades", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendRecentTradesNotification();
      res.json({ success: true, message: "Recent trades notification sent" });
    } catch (error) {
      console.error("Send recent trades notification error:", error);
      res
        .status(500)
        .json({ error: "Failed to send recent trades notification" });
    }
  });

  // Send weekly top earners notification
  app.post("/api/notifications/weekly-top-earners", async (_req, res) => {
    try {
      const { notificationService } = await import("./notification-service");
      await notificationService.sendWeeklyTopEarnersNotification();
      res.json({
        success: true,
        message: "Weekly top earners notification sent",
      });
    } catch (error) {
      console.error("Send weekly top earners notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Notify about top traders for specific time period
  app.post("/api/notifications/top-traders", async (req, res) => {
    try {
      const hours = parseInt(req.body.hours) || 24; // Default 24 hours
      const { notificationService } = await import("./notification-service");
      await notificationService.notifyTopTraders(hours);
      res.json({
        success: true,
        message: `Top traders notification sent for ${hours}h period`,
      });
    } catch (error) {
      console.error("Send top traders notification error:", error);
      res.status(500).json({ error: "Failed to send notification" });
    }
  });

  // Get analytics data
  app.get("/api/analytics/top-earners", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || undefined;
      const limit = parseInt(req.query.limit as string) || 10;
      const { notificationService } = await import("./notification-service");
      const topEarners = await notificationService.getTopEarners(limit, hours);
      res.json(topEarners);
    } catch (error) {
      console.error("Get top earners error:", error);
      res.status(500).json({ error: "Failed to fetch top earners" });
    }
  });

  app.get("/api/analytics/top-creators", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const { notificationService } = await import("./notification-service");
      const topCreators =
        await notificationService.getTopCreatorsByVolume(limit);
      res.json(topCreators);
    } catch (error) {
      console.error("Get top creators error:", error);
      res.status(500).json({ error: "Failed to fetch top creators" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
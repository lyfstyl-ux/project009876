import { createPublicClient, createWalletClient, http, type Address, type Hash, zeroAddress, parseUnits, encodeAbiParameters, parseAbiParameters } from "viem";
import { base, baseSepolia } from "viem/chains";

// Zora Factory contract address (same on Base and Base Sepolia)
const ZORA_FACTORY_ADDRESS = "0x777777751622c0d3258f214F9DF38E35BF45baF3" as const;

// Factory ABI - only the functions we need
const FACTORY_ABI = [
  {
    name: "deployCreatorCoin",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "payoutRecipient", type: "address" },
      { name: "owners", type: "address[]" },
      { name: "uri", type: "string" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "poolConfig", type: "bytes" },
      { name: "platformReferrer", type: "address" },
      { name: "coinSalt", type: "bytes32" }
    ],
    outputs: [
      { name: "coin", type: "address" }
    ]
  },
  {
    name: "deploy",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "payoutRecipient", type: "address" },
      { name: "owners", type: "address[]" },
      { name: "uri", type: "string" },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "poolConfig", type: "bytes" },
      { name: "platformReferrer", type: "address" },
      { name: "postDeployHook", type: "address" },
      { name: "postDeployHookData", type: "bytes" },
      { name: "coinSalt", type: "bytes32" }
    ],
    outputs: [
      { name: "coin", type: "address" },
      { name: "postDeployHookDataOut", type: "bytes" }
    ]
  }
] as const;

// PoolConfiguration Struct (from Zora's contract):
// struct PoolConfiguration {
//   uint8 version;
//   uint16 numPositions;
//   uint24 fee;
//   int24 tickSpacing;
//   uint16[] numDiscoveryPositions;
//   int24[] tickLower;
//   int24[] tickUpper;
//   uint256[] maxDiscoverySupplyShare;
// }

// ZORA Token Address
const ZORA_ADDRESS = "0x1111111111166b7fe7bd91427724b487980afc69" as const;

// Activity Tracker Contract ABI - for recording on-chain platform activities
const ACTIVITY_TRACKER_ABI = [
  {
    name: "recordCoinCreation",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "coin", type: "address" },
      { name: "creator", type: "address" },
      { name: "contentUrl", type: "string" },
      { name: "coinName", type: "string" },
      { name: "coinSymbol", type: "string" }
    ],
    outputs: [
      { name: "activityId", type: "bytes32" }
    ]
  }
] as const;

// Default pool configuration from Zora SDK (ZORA-paired coins)
// Source: @zoralabs/coins-sdk/src/utils/poolConfigUtils.ts
// These are the official default configs used by Zora for Creator Coins
// This same configuration is used by successful coins like:
// - balajis (0xcaf75598b8b9a6e645b60d882845d361f549f5ec)
// - and thousands of other Creator Coins on Base
const COIN_ZORA_PAIR_LOWER_TICK = -138_000;
const COIN_ZORA_PAIR_UPPER_TICK = -81_000;
const COIN_ZORA_PAIR_NUM_DISCOVERY_POSITIONS = 11;
const COIN_ZORA_PAIR_MAX_DISCOVERY_SUPPLY_SHARE = parseUnits("0.05", 18);

// Encode the pool configuration for ZORA-paired Creator Coins
// Based on successful transaction: 0x348d9a91b03a3a8e26e087b431b942dd36e989eb4e00ab8ae220f3346bc2a209
function encodePoolConfig(): `0x${string}` {
  const version = 4; // Version 4 is the current valid version (from working transactions)

  return encodeAbiParameters(
    parseAbiParameters('uint8, address, int24[], int24[], uint16[], uint256[]'),
    [
      version,                                         // version (uint8)
      ZORA_ADDRESS,                                    // currency (address)
      [COIN_ZORA_PAIR_LOWER_TICK],                    // tickLower (int24[])
      [COIN_ZORA_PAIR_UPPER_TICK],                    // tickUpper (int24[])
      [COIN_ZORA_PAIR_NUM_DISCOVERY_POSITIONS],       // numDiscoveryPositions (uint16[])
      [COIN_ZORA_PAIR_MAX_DISCOVERY_SUPPLY_SHARE]     // maxDiscoverySupplyShare (uint256[])
    ]
  );
}

// Default pool config for ZORA-paired Creator Coins (most common type)
const DEFAULT_POOL_CONFIG = encodePoolConfig();

export interface DirectCoinParams {
  name: string;
  symbol: string;
  metadataUri: string;
  creatorAddress: Address;
  platformReferrer?: Address;
  manualPoolConfig?: `0x${string}`; // Optional: provide your own poolConfig
  contentUrl?: string; // Optional: content URL for tracking
  useActivityTracker?: boolean; // Optional: enable on-chain activity tracking
}

export async function getWorkingPoolConfig(chainId: number = base.id): Promise<`0x${string}`> {
  console.log("🔍 Using ZORA-paired Creator Coin poolConfig");
  console.log("📋 Config parameters:", {
    version: 4,
    currency: "ZORA Token",
    lowerTick: COIN_ZORA_PAIR_LOWER_TICK,
    upperTick: COIN_ZORA_PAIR_UPPER_TICK,
    numPositions: COIN_ZORA_PAIR_NUM_DISCOVERY_POSITIONS,
    maxSupplyShare: "5%"
  });

  return DEFAULT_POOL_CONFIG;
}

// Helper function to encode activity tracker hook data
// Note: Zora factory passes coin and creator addresses separately to postDeploy
// Hook data only needs contentUrl, coinName, coinSymbol
function encodeActivityTrackerData(
  contentUrl: string,
  coinName: string,
  coinSymbol: string
): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters('string, string, string'),
    [contentUrl, coinName, coinSymbol]
  );
}

export async function deployCreatorCoinDirect(
  params: DirectCoinParams,
  walletClient: any,
  chainId: number = base.id
): Promise<{ hash: Hash; address: Address; createdAt: string }> {

  const chain = chainId === baseSepolia.id ? baseSepolia : base;
  const alchemyApiKey = import.meta.env.VITE_ALCHEMY_API_KEY || "o3VW3WRXrsXXMRX3l7jZxLUqhWyZzXBy";
  const rpcUrl = `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}`;

  const publicClient = createPublicClient({
    chain,
    transport: http(rpcUrl),
  });

  // Get working poolConfig (use manual if provided, otherwise use empty to trigger factory defaults)
  let poolConfig: `0x${string}`;

  if (params.manualPoolConfig) {
    console.log("✓ Using manually provided poolConfig:", params.manualPoolConfig);
    poolConfig = params.manualPoolConfig;
  } else {
    console.log("🔄 Using default poolConfig (version 4, ZORA-paired)...");
    poolConfig = await getWorkingPoolConfig(chainId);
  }

  console.log("📋 Final poolConfig to use:", {
    hex: poolConfig,
    length: poolConfig.length,
    isValid: poolConfig.startsWith('0x') && poolConfig.length > 2,
    source: params.manualPoolConfig ? 'manual' : 'default'
  });

  // Admin platform referral (20% of fees)
  const platformReferrer = params.platformReferrer || 
    import.meta.env.VITE_ADMIN_REFERRAL_ADDRESS || 
    "0xf25af781c4F1Df40Ac1D06e6B80c17815AD311F7";

  console.log("💰 Platform referrer address:", platformReferrer);

  // Generate unique salt for deterministic deployment
  const salt = `0x${Date.now().toString(16).padStart(64, '0')}` as `0x${string}`;
  console.log("🧂 Generated salt:", salt);

  // Check if activity tracker is enabled
  const activityTrackerAddress = import.meta.env.VITE_ACTIVITY_TRACKER_ADDRESS as Address | undefined;
  const useTracker = params.useActivityTracker && activityTrackerAddress;

  if (useTracker) {
    console.log("📊 On-chain activity tracking ENABLED");
    console.log("📍 Activity tracker address:", activityTrackerAddress);
  }

  try {
    let hash: Hash;

    if (useTracker && activityTrackerAddress) {
      // Use deploy function with activity tracker hook
      console.log("🔧 Deploying with activity tracker...");

      // Encode hook data: Zora factory will pass coin and creator to postDeploy separately
      const hookData = encodeActivityTrackerData(
        params.contentUrl || params.metadataUri,
        params.name,
        params.symbol
      );

      console.log("🔧 Simulating deploy with tracker hook");

      const { request } = await publicClient.simulateContract({
        address: ZORA_FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "deploy",
        args: [
          params.creatorAddress, // payoutRecipient
          [params.creatorAddress], // owners
          params.metadataUri, // uri
          params.name, // name
          params.symbol, // symbol
          poolConfig, // poolConfig
          platformReferrer as Address, // platformReferrer
          activityTrackerAddress, // postDeployHook
          hookData, // postDeployHookData
          salt // coinSalt
        ],
        account: params.creatorAddress,
      });

      console.log("✅ Contract simulation successful with tracker");
      hash = await walletClient.writeContract(request);
      console.log("✅ Transaction sent with tracker! Hash:", hash);
    } else {
      // Use standard deployCreatorCoin function
      console.log("🔧 Simulating standard deployment");

      const { request } = await publicClient.simulateContract({
        address: ZORA_FACTORY_ADDRESS,
        abi: FACTORY_ABI,
        functionName: "deployCreatorCoin",
        args: [
          params.creatorAddress, // payoutRecipient
          [params.creatorAddress], // owners
          params.metadataUri, // uri
          params.name, // name
          params.symbol, // symbol
          poolConfig, // poolConfig
          platformReferrer as Address, // platformReferrer
          salt // coinSalt
        ],
        account: params.creatorAddress,
      });

      console.log("✅ Contract simulation successful");
      hash = await walletClient.writeContract(request);
      console.log("✅ Transaction sent! Hash:", hash);
    }

    // Wait for transaction
    console.log("⏳ Waiting for transaction confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Transaction confirmed! Receipt:", receipt);

    // Extract coin address from logs
    const coinAddress = receipt.logs[0]?.address as Address;
    console.log("🎉 Coin deployed at address:", coinAddress);

    if (useTracker) {
      console.log("📊 On-chain activity recorded! Check tracker contract for details.");
    }

    console.log("✅ Coin deployed successfully:", coinAddress);

    // Get the blockchain timestamp from the transaction receipt
    const block = await publicClient.getBlock({ 
      blockNumber: receipt.blockNumber 
    });
    const createdAt = new Date(Number(block.timestamp) * 1000).toISOString();

    return {
      hash,
      address: coinAddress,
      createdAt // Include the blockchain timestamp
    };
  } catch (error) {
    console.error("❌ Contract call failed:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}
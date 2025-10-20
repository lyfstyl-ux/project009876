import { useQuery } from "@tanstack/react-query";
import { CreatorCard } from "@/components/creator-card";
import { CoinCard } from "@/components/coin-card";
import { TopCreatorsStories } from "@/components/top-creators-stories";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  TrendingUp,
  Music,
  Palette,
  Gamepad2,
  Code,
  Shirt,
  Dumbbell,
  GraduationCap,
  Tv,
  Globe,
  ChevronLeft,
  ChevronRight,
  Coins,
  PenTool,
  Heart,
} from "lucide-react";
import {
  SiYoutube,
  SiTiktok,
  SiInstagram,
  SiMedium,
  SiX,
} from "react-icons/si";
import type { User } from "@shared/schema";
import { useState, useMemo, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import TradeModalDesktop from "@/components/trade-modal-desktop";
import TradeModalMobile from "@/components/trade-modal-mobile";

type Coin = {
  id: string;
  name: string;
  symbol: string;
  address: string;
  image?: string;
  marketCap?: string;
  volume24h?: string;
  holders?: number;
  creator?: string;
  createdAt?: string;
  category?: string;
  platform?: string;
  creator_wallet?: string;
  metadata?: any;
};

export default function Home() {
  // Mock creators for stories section
  const mockTrendingCreators: User[] = [
    {
      id: "0x1234567890123456789012345678901234567890",
      username: "sarah_j",
      displayName: "Sarah Johnson",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
      bio: "Digital artist & NFT creator",
      createdAt: new Date().toISOString(),
    },
    {
      id: "0x2345678901234567890123456789012345678901",
      username: "alex_c",
      displayName: "Alex Chen",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
      bio: "Music producer & creator",
      createdAt: new Date().toISOString(),
    },
    {
      id: "0x3456789012345678901234567890123456789012",
      username: "maya_p",
      displayName: "Maya Patel",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
      bio: "Tech educator & builder",
      createdAt: new Date().toISOString(),
    },
    {
      id: "0x4567890123456789012345678901234567890123",
      username: "jordan_s",
      displayName: "Jordan Smith",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
      bio: "Content creator & streamer",
      createdAt: new Date().toISOString(),
    },
    {
      id: "0x5678901234567890123456789012345678901234",
      username: "emma_w",
      displayName: "Emma Wilson",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=emma",
      bio: "Fashion designer & artist",
      createdAt: new Date().toISOString(),
    },
    {
      id: "0x6789012345678901234567890123456789012345",
      username: "chris_m",
      displayName: "Chris Martinez",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=chris",
      bio: "Photographer & visual artist",
      createdAt: new Date().toISOString(),
    },
    {
      id: "0x7890123456789012345678901234567890123456",
      username: "priya_k",
      displayName: "Priya Kumar",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      bio: "Writer & storyteller",
      createdAt: new Date().toISOString(),
    },
    {
      id: "0x8901234567890123456789012345678901234567",
      username: "tyler_b",
      displayName: "Tyler Brown",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=tyler",
      bio: "Game developer & designer",
      createdAt: new Date().toISOString(),
    },
    {
      id: "0x9012345678901234567890123456789012345678",
      username: "sophia_l",
      displayName: "Sophia Lee",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=sophia",
      bio: "Fitness coach & influencer",
      createdAt: new Date().toISOString(),
    },
    {
      id: "0xa123456789012345678901234567890123456789",
      username: "ryan_d",
      displayName: "Ryan Davis",
      avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=ryan",
      bio: "Video editor & filmmaker",
      createdAt: new Date().toISOString(),
    },
  ];

  const { data: trendingCreators = mockTrendingCreators, isLoading } = useQuery<
    User[]
  >({
    queryKey: ["/api/creators/trending"],
    initialData: mockTrendingCreators,
  });

  const { data: featuredProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["/api/projects/featured"],
  });

  // Fetch trending coins from Zora
  const { data: zoraCoinsData, isLoading: loadingZoraCoins } = useQuery({
    queryKey: ["/api/zora/coins/top-volume"],
    queryFn: async () => {
      const response = await fetch("/api/zora/coins/top-volume?count=30");
      if (!response.ok) throw new Error("Failed to fetch Zora coins");
      return response.json();
    },
  });

  const [selectedCategory, setSelectedCategory] = useState("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [coinMarketCaps, setCoinMarketCaps] = useState<Record<string, string>>(
    {},
  );
  const [coinVolumes, setCoinVolumes] = useState<Record<string, string>>({});
  const [coinHolders, setCoinHolders] = useState<Record<string, number>>({});
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Custom icon components for platforms not in lucide-react
  const FarcasterIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.5 4h-17A1.5 1.5 0 002 5.5v13A1.5 1.5 0 003.5 20h17a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0020.5 4zm-8.53 11.94c-2.11 0-3.82-1.71-3.82-3.82s1.71-3.82 3.82-3.82 3.82 1.71 3.82 3.82-1.71 3.82-3.82 3.82z" />
    </svg>
  );

  const GitcoinIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z" />
      <path d="M12 6c-3.309 0-6 2.691-6 6s2.691 6 6 6 6-2.691 6-6-2.691-6-6-6zm0 10c-2.206 0-4-1.794-4-4s1.794-4 4-4 4 1.794 4 4-1.794 4-4 4z" />
    </svg>
  );

  const KarmaIcon = ({ className }: { className?: string }) => (
    <Heart className={className} />
  );

  const categories = [
    { id: "all", label: "All", Icon: Globe },
    { id: "farcaster", label: "Farcaster", Icon: FarcasterIcon },
    { id: "gitcoin", label: "Gitcoin", Icon: GitcoinIcon },
    { id: "karmagap", label: "KarmaGap", Icon: KarmaIcon },
    { id: "publicgoods", label: "Public Goods", Icon: Coins },
    { id: "music", label: "Music", Icon: Music },
    { id: "tiktok", label: "TikTok", Icon: SiTiktok },
    { id: "instagram", label: "Instagram", Icon: SiInstagram },
    { id: "medium", label: "Medium", Icon: SiMedium },
    { id: "giveth", label: "Giveth", Icon: Coins },
    { id: "twitter", label: "Twitter", Icon: SiX },
    { id: "blog", label: "Blog", Icon: PenTool },
  ];

  // Transform Zora coins data to match our Coin type
  const zoraCoins: Coin[] = useMemo(() => {
    if (!zoraCoinsData?.coins) return [];

    return zoraCoinsData.coins.map((coin: any) => ({
      id: coin.id || coin.address,
      name: coin.name || "Unnamed Coin",
      symbol: coin.symbol || "???",
      address: coin.address,
      image:
        coin.mediaContent?.previewImage?.medium ||
        coin.mediaContent?.previewImage?.small,
      marketCap: coin.marketCap ? parseFloat(coin.marketCap).toFixed(2) : "0",
      volume24h: coin.volume24h ? parseFloat(coin.volume24h).toFixed(2) : "0",
      holders: coin.uniqueHolders || 0,
      creator: coin.creatorAddress,
      createdAt: coin.createdAt,
      category: "Zora",
      platform: "zora",
      creator_wallet: coin.creatorAddress,
      metadata: coin,
    }));
  }, [zoraCoinsData]);

  const filteredCreators = useMemo(() => {
    if (!trendingCreators) return [];
    if (selectedCategory === "all") return trendingCreators;
    return trendingCreators.filter((creator) =>
      creator.categories?.includes(selectedCategory),
    );
  }, [trendingCreators, selectedCategory]);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === "left" ? -400 : 400;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const openTradeModal = (coin: Coin) => {
    setSelectedCoin(coin);
    setIsTradeModalOpen(true);
  };

  const closeTradeModal = () => {
    setSelectedCoin(null);
    setIsTradeModalOpen(false);
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Instagram Stories Section */}
      <section className="space-y-3">
        {isLoading ? (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 justify-center">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1.5 flex-shrink-0"
              >
                <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
                <div className="h-2.5 w-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : trendingCreators && trendingCreators.length > 0 ? (
          <TopCreatorsStories creators={trendingCreators} limit={10} />
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <p className="text-sm">
              No creators available yet. Be the first to create!
            </p>
          </div>
        )}
      </section>


      {/* Trending Coins */}
      <section className="space-y-6" data-tour="trending-coins">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Coins className="h-4 w-4 text-primary" />
            <h2 className="text-1xl font-bold">Trending</h2>
          </div>
          <Button variant="ghost" size="sm" data-testid="button-view-all-coins">
            View All
          </Button>
        </div>

        {loadingZoraCoins ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-64 bg-card rounded-2xl animate-pulse"
                data-testid="skeleton-coin-card"
              />
            ))}
          </div>
        ) : zoraCoins.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1">
            {zoraCoins.slice(0, 12).map((coin) => (
              <CoinCard
                key={coin.id}
                coin={coin}
                onClick={() => openTradeModal(coin)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No coins available from Zora at the moment
            </p>
          </div>
        )}
      </section>

      {selectedCoin &&
        (isMobile ? (
          <TradeModalMobile
            coin={selectedCoin}
            open={isTradeModalOpen}
            onOpenChange={setIsTradeModalOpen}
          />
        ) : (
          <TradeModalDesktop
            coin={selectedCoin}
            open={isTradeModalOpen}
            onOpenChange={setIsTradeModalOpen}
          />
        ))}
    </div>
  );
}

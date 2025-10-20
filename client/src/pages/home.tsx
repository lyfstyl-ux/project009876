import { useQuery } from "@tanstack/react-query";
import { CreatorCard } from "@/components/creator-card";
import { CoinCard } from "@/components/coin-card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Music, Palette, Gamepad2, Code, Shirt, Dumbbell, GraduationCap, Tv, Globe, ChevronLeft, ChevronRight, Coins } from "lucide-react";
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
  const { data: trendingCreators, isLoading } = useQuery<User[]>({
    queryKey: ["/api/creators/trending"],
  });

  const { data: featuredProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["/api/projects/featured"],
  });

  const [selectedCategory, setSelectedCategory] = useState("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [coinMarketCaps, setCoinMarketCaps] = useState<Record<string, string>>({});
  const [coinVolumes, setCoinVolumes] = useState<Record<string, string>>({});
  const [coinHolders, setCoinHolders] = useState<Record<string, number>>({});
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const isMobile = useIsMobile();


  const categories = [
    { id: "all", label: "All", Icon: Globe },
    { id: "Music", label: "Music", Icon: Music },
    { id: "Art", label: "Art", Icon: Palette },
    { id: "Gaming", label: "Gaming", Icon: Gamepad2 },
    { id: "Tech", label: "Tech", Icon: Code },
    { id: "Fashion", label: "Fashion", Icon: Shirt },
    { id: "Fitness", label: "Fitness", Icon: Dumbbell },
    { id: "Education", label: "Education", Icon: GraduationCap },
    { id: "Entertainment", label: "Entertainment", Icon: Tv },
  ];

  const mockCoins = [
    {
      id: "1",
      name: "Creative Coin",
      symbol: "CRTV",
      address: "0x1234567890abcdef",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
      marketCap: "125,000",
      volume24h: "15,250",
      holders: 342,
      creator: "sarah_artist",
      category: "Art",
      platform: "instagram",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      name: "Music Token",
      symbol: "MUSI",
      address: "0xabcdef1234567890",
      image: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=400&fit=crop",
      marketCap: "89,500",
      volume24h: "8,920",
      holders: 215,
      creator: "dj_beats",
      category: "Music",
      platform: "spotify",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      name: "Gaming Gem",
      symbol: "GAME",
      address: "0xfedcba0987654321",
      image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop",
      marketCap: "256,800",
      volume24h: "32,100",
      holders: 589,
      creator: "pro_gamer",
      category: "Gaming",
      platform: "youtube",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      name: "Tech Coin",
      symbol: "TECH",
      address: "0x9876543210fedcba",
      image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=400&fit=crop",
      marketCap: "178,900",
      volume24h: "21,450",
      holders: 412,
      creator: "dev_master",
      category: "Tech",
      platform: "github",
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "5",
      name: "Fashion Token",
      symbol: "FASH",
      address: "0x5432109876fedcba",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=400&fit=crop",
      marketCap: "142,300",
      volume24h: "18,670",
      holders: 367,
      creator: "style_icon",
      category: "Fashion",
      platform: "tiktok",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "6",
      name: "Fitness Fuel",
      symbol: "FIT",
      address: "0xabcd1234efgh5678",
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=400&fit=crop",
      marketCap: "95,600",
      volume24h: "11,230",
      holders: 278,
      creator: "fit_coach",
      category: "Fitness",
      platform: "youtube",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const filteredCreators = useMemo(() => {
    if (!trendingCreators) return [];
    if (selectedCategory === "all") return trendingCreators;
    return trendingCreators.filter((creator) => 
      creator.categories?.includes(selectedCategory)
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
      {/* Category Chips */}
      <section className="relative group">
        {/* Left Arrow - Hidden on mobile */}
        <button
          onClick={() => scroll("left")}
          className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-full border border-border/50 hover:bg-muted/30 transition-all opacity-0 group-hover:opacity-100"
          data-testid="button-scroll-left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Category Chips */}
        <div
          ref={scrollContainerRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((category) => {
            const IconComponent = category.Icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                type="button"
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/20 text-muted-foreground hover:bg-muted/30 hover:text-foreground"
                }`}
                data-testid={`button-category-${category.id}`}
              >
                <IconComponent className="w-4 h-4" />
                {category.label}
              </button>
            );
          })}
        </div>

        {/* Right Arrow - Hidden on mobile */}
        <button
          onClick={() => scroll("right")}
          className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm p-2 rounded-full border border-border/50 hover:bg-muted/30 transition-all opacity-0 group-hover:opacity-100"
          data-testid="button-scroll-right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </section>

      {/* Trending Coins */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Trending Coins</h2>
          </div>
          <Button variant="ghost" size="sm" data-testid="button-view-all-coins">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
          {mockCoins.map((coin) => (
            <CoinCard key={coin.id} coin={coin} onClick={() => openTradeModal(coin)} />
          ))}
        </div>
      </section>

      {/* Trending Creators */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Trending Creators</h2>
          </div>
          <Button variant="ghost" size="sm" data-testid="button-view-all-creators">
            View All
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-card rounded-2xl animate-pulse"
                data-testid="skeleton-creator-card"
              />
            ))}
          </div>
        ) : filteredCreators && filteredCreators.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {selectedCategory === "all" 
                ? "No creators yet. Be the first!" 
                : `No creators found in ${selectedCategory}`}
            </p>
          </div>
        )}
      </section>

      {/* Stats Section */}
      <section className="bg-card border border-border rounded-2xl p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary" data-testid="text-stat-creators">
              10K+
            </div>
            <div className="text-muted-foreground mt-2">Active Creators</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent" data-testid="text-stat-volume">
              $5M+
            </div>
            <div className="text-muted-foreground mt-2">Trading Volume</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-chart-4" data-testid="text-stat-earnings">
              $2M+
            </div>
            <div className="text-muted-foreground mt-2">Creator Earnings</div>
          </div>
        </div>
      </section>

      {selectedCoin && (
        isMobile ? (
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
        )
      )}
    </div>
  );
}
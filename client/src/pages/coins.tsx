
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CoinCard } from "@/components/coin-card";
import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, DollarSign, Clock, Sparkles } from "lucide-react";
import TradeModalDesktop from "@/components/trade-modal-desktop";
import TradeModalMobile from "@/components/trade-modal-mobile";
import { useIsMobile } from "@/hooks/use-mobile";

type ZoraCoin = {
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

export default function CoinsPage() {
  const [selectedTab, setSelectedTab] = useState<"volume" | "gainers" | "valuable" | "new">("volume");
  const [selectedCoin, setSelectedCoin] = useState<ZoraCoin | null>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const isMobile = useIsMobile();

  // Fetch coins based on selected tab
  const endpoint = {
    volume: "/api/zora/coins/top-volume",
    gainers: "/api/zora/coins/top-gainers",
    valuable: "/api/zora/coins/most-valuable",
    new: "/api/zora/coins/new",
  }[selectedTab];

  const { data: coinsData, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const response = await fetch(`${endpoint}?count=50`);
      if (!response.ok) throw new Error("Failed to fetch coins");
      return response.json();
    },
  });

  const coins: ZoraCoin[] = coinsData?.coins?.map((coin: any) => ({
    id: coin.id || coin.address,
    name: coin.name || "Unnamed Coin",
    symbol: coin.symbol || "???",
    address: coin.address,
    image: coin.mediaContent?.previewImage?.medium || coin.mediaContent?.previewImage?.small,
    marketCap: coin.marketCap ? parseFloat(coin.marketCap).toFixed(2) : "0",
    volume24h: coin.volume24h ? parseFloat(coin.volume24h).toFixed(2) : "0",
    holders: coin.uniqueHolders || 0,
    creator: coin.creatorAddress,
    createdAt: coin.createdAt,
    category: "Zora",
    platform: "zora",
    creator_wallet: coin.creatorAddress,
    metadata: coin,
  })) || [];

  const openTradeModal = (coin: ZoraCoin) => {
    setSelectedCoin(coin);
    setIsTradeModalOpen(true);
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-2">
        <Coins className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Explore Coins</h1>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedTab("volume")}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
            selectedTab === "volume"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Top Volume
        </button>
        <button
          onClick={() => setSelectedTab("gainers")}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
            selectedTab === "gainers"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Top Gainers
        </button>
        <button
          onClick={() => setSelectedTab("valuable")}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
            selectedTab === "valuable"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Most Valuable
        </button>
        <button
          onClick={() => setSelectedTab("new")}
          className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
            selectedTab === "new"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/20 text-muted-foreground hover:bg-muted/30"
          }`}
        >
          <Clock className="w-4 h-4" />
          New Coins
        </button>
      </div>

      {/* Coins Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-card rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : coins.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-1">
          {coins.map((coin) => (
            <CoinCard
              key={coin.id}
              coin={coin}
              onClick={() => openTradeModal(coin)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Coins className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No coins found</h3>
          <p className="text-muted-foreground">
            Try selecting a different category
          </p>
        </div>
      )}

      {/* Trade Modal */}
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


import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, User, Coins } from "lucide-react";
import { useState } from "react";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { cn } from "@/lib/utils";

interface CoinCardProps {
  coin: {
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
  };
  className?: string;
  onClick?: () => void;
}

export function CoinCard({ coin, className, onClick }: CoinCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden rounded-3xl border-border/50 bg-card cursor-pointer transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1",
        className
      )}
    >
      {/* Coin Image */}
      <div className="relative w-full aspect-square bg-gradient-to-br from-muted/20 to-muted/10 overflow-hidden">
        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 rounded px-1.5 py-0.5 z-10">
          <span className="text-[8px] text-muted-foreground font-medium">
            {coin.createdAt
              ? new Date(coin.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : new Date().toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
          </span>
        </div>

        {coin.category && (
          <div className="absolute top-1.5 right-1.5 z-10">
            <Badge variant="secondary" className="text-[8px] px-1.5 py-0.5 h-auto font-medium">
              {coin.category}
            </Badge>
          </div>
        )}

        {coin.image && !imageError ? (
          <img
            src={coin.image}
            alt={coin.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Coins className="w-8 h-8 text-primary/40" />
          </div>
        )}
      </div>

      {/* Coin Info */}
      <div className="p-2 space-y-1.5 flex-1 flex flex-col">
        <div className="flex-1 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-xs truncate text-foreground">
              {coin.name}
            </h3>
            <p className="text-[10px] text-muted-foreground truncate">
              {coin.symbol}
            </p>
          </div>
          <div className="flex items-center gap-1 ml-1">
            <img
              src={createAvatar(avataaars, {
                seed: coin.creator || "default",
                size: 14,
              }).toDataUri()}
              alt="Creator avatar"
              className="w-3.5 h-3.5 rounded-full object-cover"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-1 pt-1.5 border-t border-border/50">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5 text-green-500" />
              <span className="text-muted-foreground">MC:</span>
              <span className="font-semibold text-foreground">
                ${coin.marketCap || "0"}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5 text-purple-500" />
              <span className="text-muted-foreground">Vol:</span>
              <span className="font-semibold text-foreground">
                ${coin.volume24h || "0"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-0.5">
              <User className="h-2.5 w-2.5 text-orange-500" />
              <span className="text-muted-foreground">Holders:</span>
              <span className="font-semibold text-foreground">
                {coin.holders || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

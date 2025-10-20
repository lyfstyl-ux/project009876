
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Users, TrendingUp, Award, Star, Flame } from "lucide-react";
import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { usePrivy } from "@privy-io/react-auth";

export default function Creators() {
  const { user: privyUser } = usePrivy();
  const [selectedTab, setSelectedTab] = useState<"top" | "rising" | "new">("top");

  const { data: creators = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/creators"],
  });

  const enrichedCreators = creators.map((creator) => {
    return {
      ...creator,
      avatarUrl:
        creator.avatarUrl ||
        createAvatar(avataaars, {
          seed: creator.id,
          size: 56,
        }).toDataUri(),
    };
  });

  const filteredCreators = enrichedCreators
    .filter((creator) => creator.totalConnections && creator.totalConnections > 0)
    .sort((a, b) => {
      switch (selectedTab) {
        case "top":
          return (b.totalConnections || 0) - (a.totalConnections || 0);
        case "rising":
          return (b.totalProfileViews || 0) - (a.totalProfileViews || 0);
        case "new":
          return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
        default:
          return (b.totalConnections || 0) - (a.totalConnections || 0);
      }
    });

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getAvatarBgColor = (index: number) => {
    const colors = [
      "bg-pink-200 dark:bg-pink-300",
      "bg-purple-200 dark:bg-purple-300",
      "bg-yellow-200 dark:bg-yellow-300",
      "bg-blue-200 dark:bg-blue-300",
      "bg-green-200 dark:bg-green-300",
      "bg-orange-200 dark:bg-orange-300",
      "bg-red-200 dark:bg-red-300",
      "bg-indigo-200 dark:bg-indigo-300",
    ];
    return colors[index % colors.length];
  };

  const getRankColor = (index: number) => {
    const colors = [
      "text-pink-600 dark:text-pink-500",
      "text-purple-600 dark:text-purple-500",
      "text-yellow-600 dark:text-yellow-500",
      "text-blue-600 dark:text-blue-500",
      "text-green-600 dark:text-green-500",
      "text-orange-600 dark:text-orange-500",
      "text-red-600 dark:text-red-500",
      "text-indigo-600 dark:text-indigo-500",
    ];
    return colors[index % colors.length];
  };

  const totalMarketCap = filteredCreators.reduce((acc, creator) => acc + (creator.totalConnections || 0) * 100, 0);
  const totalEarnings = filteredCreators.reduce((acc, creator) => acc + (creator.e1xpPoints || 0) * 0.001, 0);

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              Top <span className="text-primary">Creators</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Discover the most successful content creators on CoinIT.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-6 text-left lg:text-right">
            <div className="text-center lg:text-right">
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {filteredCreators.length}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                Active Creators
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="text-lg sm:text-xl font-bold text-foreground">
                ${totalMarketCap.toFixed(2)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                Total Market Cap
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="text-lg sm:text-xl font-bold text-green-500">
                ${totalEarnings.toFixed(8)}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                Total Earnings
              </div>
            </div>
            <div className="text-center lg:text-right">
              <div className="text-lg sm:text-xl font-bold text-foreground">
                {filteredCreators.length > 0
                  ? Math.round(
                      filteredCreators.reduce((acc, creator) => acc + (creator.totalConnections || 0), 0) /
                        filteredCreators.length
                    )
                  : 0}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                Avg. Coins
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible">
        <button
          onClick={() => setSelectedTab("top")}
          className={`px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
            selectedTab === "top"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/20 text-muted-foreground hover:text-foreground"
          }`}
        >
          Top Creators
        </button>
        <button
          onClick={() => setSelectedTab("rising")}
          className={`px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
            selectedTab === "rising"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/20 text-muted-foreground hover:text-foreground"
          }`}
        >
          Rising Stars
        </button>
        <button
          onClick={() => setSelectedTab("new")}
          className={`px-4 sm:px-6 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${
            selectedTab === "new"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/20 text-muted-foreground hover:text-foreground"
          }`}
        >
          New Creators
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-muted/20 rounded-full animate-pulse flex-shrink-0"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-5 bg-muted/20 rounded w-32 sm:w-40 animate-pulse"></div>
                  <div className="h-4 bg-muted/20 rounded w-24 sm:w-32 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredCreators.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No creators yet</h3>
          <p className="text-muted-foreground mb-6">Be the first to create content and become a creator!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredCreators.map((creator, index) => {
            const isCurrentUser = privyUser?.wallet?.address && creator.id === privyUser.wallet.address;
            const createdDaysAgo = Math.floor(
              (Date.now() - new Date(creator.createdAt || "").getTime()) / (1000 * 60 * 60 * 24)
            );
            const isVeteran = createdDaysAgo >= 365;

            return (
              <div
                key={creator.id}
                className={`rounded-2xl overflow-hidden transition-all ${
                  isCurrentUser
                    ? "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30"
                    : "bg-card"
                }`}
              >
                <div className="flex sm:hidden flex-col p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`text-2xl font-black ${getRankColor(index)} flex-shrink-0 w-8`}>
                      {index + 1}
                    </div>

                    <div
                      className={`relative flex-shrink-0 cursor-pointer rounded-full p-0.5 ${getAvatarBgColor(index)}`}
                    >
                      <img
                        src={creator.avatarUrl}
                        alt={creator.displayName || creator.username}
                        className="w-9 h-9 rounded-full"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-foreground font-bold text-sm truncate">
                          {isCurrentUser ? "You" : creator.displayName || creator.username}
                        </h3>
                        {index === 0 && <Award className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
                      </div>
                      {isVeteran && (
                        <div className="flex items-center gap-1 mt-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          <span className="text-xs text-orange-600 dark:text-orange-500 font-medium">1+ year</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 pl-11">
                    <div className="text-center">
                      <div className="text-foreground font-bold text-xs">{creator.totalConnections || 0}</div>
                      <div className="text-muted-foreground text-[10px]">Coins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-foreground font-bold text-sm">
                        ${((creator.totalConnections || 0) * 100).toFixed(2)}
                      </div>
                      <div className="text-muted-foreground text-[10px]">Market Cap</div>
                    </div>
                    <div className="text-center">
                      <div className="text-foreground font-bold text-sm">{creator.totalProfileViews || 0}</div>
                      <div className="text-muted-foreground text-[10px]">Holders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-500 font-bold text-sm">
                        ${((creator.e1xpPoints || 0) * 0.001).toFixed(8)}
                      </div>
                      <div className="text-muted-foreground text-[10px]">Earnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-500 font-bold text-sm flex items-center justify-center gap-1">
                        <Star className="w-3 h-3" />
                        {creator.e1xpPoints || 0}
                      </div>
                      <div className="text-muted-foreground text-[10px]">E1XP</div>
                    </div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2 p-2 hover:bg-muted/5 transition-colors">
                  <div className="relative flex-shrink-0 cursor-pointer">
                    <img
                      src={creator.avatarUrl}
                      alt={creator.displayName || creator.username}
                      className="w-10 h-10 rounded-full hover:ring-2 hover:ring-primary transition-all"
                    />
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-6 gap-2 items-center">
                    <div className="min-w-0">
                      <h3 className="text-foreground font-bold text-sm truncate flex items-center gap-1">
                        {creator.displayName || creator.username}
                        {index === 0 && <Award className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
                      </h3>
                      <p className="text-muted-foreground text-[10px]">{creator.username}</p>
                    </div>
                    <div className="text-center">
                      <div className="text-foreground font-bold text-sm">{creator.totalConnections || 0}</div>
                      <div className="text-muted-foreground text-[10px]">Coins</div>
                    </div>
                    <div className="text-center">
                      <div className="text-foreground font-bold text-sm">
                        ${((creator.totalConnections || 0) * 100).toFixed(2)}
                      </div>
                      <div className="text-muted-foreground text-[10px]">Market Cap</div>
                    </div>
                    <div className="text-center">
                      <div className="text-foreground font-bold text-sm">{creator.totalProfileViews || 0}</div>
                      <div className="text-muted-foreground text-[10px]">Holders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-500 font-bold text-sm">
                        ${((creator.e1xpPoints || 0) * 0.001).toFixed(8)}
                      </div>
                      <div className="text-muted-foreground text-[10px]">Earnings</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-500 font-bold text-sm flex items-center justify-center gap-1">
                        <Star className="w-3 h-3" />
                        {creator.e1xpPoints || 0}
                      </div>
                      <div className="text-muted-foreground text-[10px]">E1XP</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

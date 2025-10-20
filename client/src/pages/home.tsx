import { useQuery } from "@tanstack/react-query";
import { CreatorCard } from "@/components/creator-card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp } from "lucide-react";
import type { User } from "@shared/schema";

export default function Home() {
  const { data: trendingCreators, isLoading } = useQuery<User[]>({
    queryKey: ["/api/creators/trending"],
  });

  const { data: featuredProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["/api/projects/featured"],
  });

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Transform Your Content Into
          <span className="text-primary"> Tradeable Assets</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Mint creator coins, earn passive income, and build your Web3 creator economy on Base
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button size="lg" data-testid="button-get-started">
            <Sparkles className="h-5 w-5 mr-2" />
            Get Started
          </Button>
          <Button size="lg" variant="outline" data-testid="button-explore">
            Explore Creators
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-card rounded-2xl animate-pulse"
                data-testid="skeleton-creator-card"
              />
            ))}
          </div>
        ) : trendingCreators && trendingCreators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {trendingCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No creators yet. Be the first!</p>
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
    </div>
  );
}

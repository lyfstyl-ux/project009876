import { useQuery } from "@tanstack/react-query";
import { CreatorCard } from "@/components/creator-card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Music, Palette, Gamepad2, Code, Shirt, Dumbbell, GraduationCap, Tv, Globe, ChevronLeft, ChevronRight } from "lucide-react";
import type { User } from "@shared/schema";
import { useState, useMemo, useRef } from "react";

export default function Home() {
  const { data: trendingCreators, isLoading } = useQuery<User[]>({
    queryKey: ["/api/creators/trending"],
  });

  const { data: featuredProjects, isLoading: loadingProjects } = useQuery({
    queryKey: ["/api/projects/featured"],
  });

  const [selectedCategory, setSelectedCategory] = useState("all");
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-12">
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
    </div>
  );
}
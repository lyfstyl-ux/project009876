import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CreatorCard } from "@/components/creator-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search as SearchIcon, Filter, X } from "lucide-react";
import type { User } from "@shared/schema";

export default function Search() {
  const [location] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const [searchQuery, setSearchQuery] = useState(urlParams.get('q') || "");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    if (query) {
      setSearchQuery(query);
    }
  }, [location]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("connections");

  const { data: creators, isLoading } = useQuery<User[]>({
    queryKey: ["/api/creators", { search: searchQuery, category: selectedCategory, location: selectedLocation, sortBy }],
  });

  const categories = [
    "All Categories",
    "Music",
    "Art",
    "Gaming",
    "Tech",
    "Fashion",
    "Fitness",
    "Education",
    "Entertainment",
  ];

  const handleClearFilters = () => {
    setSelectedCategory("all");
    setSelectedLocation("all");
    setSortBy("connections");
    setSearchQuery("");
  };

  return (
    <div className="container max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Search Bar */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search creators, categories, locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-base"
          data-testid="input-search"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-3 flex-1">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]" data-testid="select-category">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="music">Music</SelectItem>
              <SelectItem value="art">Art</SelectItem>
              <SelectItem value="gaming">Gaming</SelectItem>
              <SelectItem value="tech">Tech</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]" data-testid="select-location">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="us">United States</SelectItem>
              <SelectItem value="uk">United Kingdom</SelectItem>
              <SelectItem value="global">Global</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="connections">Most Connections</SelectItem>
              <SelectItem value="views">Most Views</SelectItem>
              <SelectItem value="earnings">Top Earnings</SelectItem>
              <SelectItem value="recent">Recently Joined</SelectItem>
            </SelectContent>
          </Select>

          {(selectedCategory !== "all" || selectedLocation !== "all" || sortBy !== "connections") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        <Badge variant="secondary" className="text-sm">
          {creators?.length || 0} creators found
        </Badge>
      </div>

      {/* Trending Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Trending Categories</h3>
        <div className="flex flex-wrap gap-2">
          {categories.slice(1, 6).map((category) => (
            <Badge
              key={category}
              variant="outline"
              className="cursor-pointer hover-elevate transition-all"
              onClick={() => setSelectedCategory(category.toLowerCase())}
              data-testid={`badge-trending-${category.toLowerCase()}`}
            >
              {category}
            </Badge>
          ))}
        </div>
      </div>

      {/* Results Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="h-80 bg-card rounded-2xl animate-pulse"
              data-testid="skeleton-creator-card"
            />
          ))}
        </div>
      ) : creators && creators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {creators.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No creators found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search query
          </p>
        </div>
      )}
    </div>
  );
}

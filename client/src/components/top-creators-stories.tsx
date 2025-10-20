import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@shared/schema";
import { Link } from "wouter";

interface TopCreatorsStoriesProps {
  creators: User[];
  limit?: number;
  className?: string;
}

export function TopCreatorsStories({
  creators,
  limit = 6,
  className,
}: TopCreatorsStoriesProps) {
  const topCreators = creators.slice(0, limit);

  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto scrollbar-hide pb-2 justify-center",
        className,
      )}
    >
      {topCreators.map((creator, index) => {
        // Calculate earnings (E1XP * 0.001)
        const earnings = ((creator.e1xpPoints || 0) * 0.001).toFixed(2);

        return (
          <Link
            key={creator.id}
            href={`/profile/${creator.username || creator.id}`}
            className="flex flex-col items-center gap-1 flex-shrink-0 group cursor-pointer"
            data-testid={`link-story-creator-${creator.id}`}
          >
            <div className="relative">
              {/* Instagram-style gradient ring with animation */}
              <div className="p-[2px] rounded-full bg-gradient-to-tr from-primary via-secondary to-accent group-hover:scale-105 transition-transform duration-200">
                <div className="p-[1.5px] rounded-full bg-background">
                  <Avatar className="h-12 w-12 ring-0">
                    <AvatarImage src={creator.avatarUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-bold text-sm">
                      {creator.username?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              {/* Earnings badge */}
              <div className="absolute -bottom-0.5 -right-0.5 min-w-[20px] h-3.5 px-1 rounded-full bg-green-500 flex items-center justify-center text-[8px] font-bold text-white ring-1 ring-background">
                ${earnings}
              </div>
            </div>

            <span className="text-[10px] font-medium text-foreground max-w-[56px] truncate text-center group-hover:text-primary transition-colors">
              {creator.username || "Unknown"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

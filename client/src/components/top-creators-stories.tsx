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
  className 
}: TopCreatorsStoriesProps) {
  const topCreators = creators.slice(0, limit);

  return (
    <div className={cn("flex gap-5 overflow-x-auto scrollbar-hide pb-3 -mx-2 px-2", className)}>
      {topCreators.map((creator, index) => (
        <Link
          key={creator.id}
          href={`/profile/${creator.id}`}
          className="flex flex-col items-center gap-2.5 flex-shrink-0 group"
          data-testid={`link-story-creator-${creator.id}`}
        >
          <div className="relative">
            {/* Instagram-style gradient ring with animation */}
            <div className="p-[3px] rounded-full bg-gradient-to-tr from-primary via-secondary to-accent group-hover:scale-105 transition-transform duration-200">
              <div className="p-[3px] rounded-full bg-background">
                <Avatar className="h-20 w-20 ring-0">
                  <AvatarImage src={creator.avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground font-bold text-xl">
                    {creator.displayName?.charAt(0) || creator.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            
            {/* Rank badge for top 3 */}
            {index < 3 && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground shadow-lg ring-2 ring-background">
                {index + 1}
              </div>
            )}
          </div>
          
          <span className="text-xs font-medium text-foreground max-w-[80px] truncate text-center group-hover:text-primary transition-colors">
            {creator.displayName || creator.username}
          </span>
        </Link>
      ))}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Calendar, TrendingUp } from "lucide-react";
import type { LoginStreak } from "@shared/schema";

const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Streaks() {
  const { data: streak } = useQuery<LoginStreak>({
    queryKey: ["/api/streaks/me"],
  });

  const weeklyCalendar = streak?.weeklyCalendar || [false, false, false, false, false, false, false];

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Flame className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Daily Streak</h1>
        </div>
        <p className="text-muted-foreground">
          Keep your streak alive and earn bonus points!
        </p>
      </div>

      {/* Current Streak */}
      <Card className="p-8 text-center space-y-6">
        <div className="space-y-2">
          <div className="text-6xl font-bold text-primary" data-testid="text-current-streak">
            {streak?.currentStreak || 0}
          </div>
          <div className="text-lg text-muted-foreground">Day Streak</div>
        </div>

        <div className="grid grid-cols-2 gap-6 max-w-md mx-auto pt-6 border-t border-border">
          <div>
            <div className="flex items-center justify-center gap-2 text-foreground mb-1">
              <Trophy className="h-5 w-5 text-accent" />
              <span className="text-2xl font-bold" data-testid="text-longest-streak">
                {streak?.longestStreak || 0}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Longest Streak</div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 text-foreground mb-1">
              <TrendingUp className="h-5 w-5 text-chart-4" />
              <span className="text-2xl font-bold" data-testid="text-total-points">
                {streak?.totalPoints || 0}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Total Points</div>
          </div>
        </div>

        <Button size="lg" className="mt-4" data-testid="button-check-in">
          <Flame className="h-5 w-5 mr-2" />
          Check In Today
        </Button>
      </Card>

      {/* Weekly Calendar */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">This Week</h2>
        </div>

        <div className="grid grid-cols-7 gap-3">
          {daysOfWeek.map((day, index) => {
            const isCompleted = weeklyCalendar[index];
            const isToday = new Date().getDay() === (index + 1) % 7;

            return (
              <div
                key={day}
                className="text-center space-y-2"
                data-testid={`day-${day.toLowerCase()}`}
              >
                <div className="text-xs text-muted-foreground font-medium">
                  {day}
                </div>
                <div
                  className={`h-12 w-12 mx-auto rounded-lg flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? "border-primary bg-primary/10 text-primary"
                      : isToday
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-card"
                  }`}
                >
                  {isCompleted && <Flame className="h-6 w-6" />}
                  {!isCompleted && isToday && (
                    <div className="h-3 w-3 rounded-full bg-accent" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Streak Benefits */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Streak Benefits</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge className="shrink-0 bg-primary">7 Days</Badge>
            <div>
              <h3 className="font-semibold">Bonus Points</h3>
              <p className="text-sm text-muted-foreground">
                Earn 2x points on all activities
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="shrink-0 bg-accent">30 Days</Badge>
            <div>
              <h3 className="font-semibold">Creator Badge</h3>
              <p className="text-sm text-muted-foreground">
                Get a special badge on your profile
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Badge className="shrink-0 bg-chart-4">90 Days</Badge>
            <div>
              <h3 className="font-semibold">Premium Features</h3>
              <p className="text-sm text-muted-foreground">
                Unlock exclusive creator tools
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

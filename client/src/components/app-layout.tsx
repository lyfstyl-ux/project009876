import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, PlusCircle, User, TrendingUp, Coins, Compass, PenTool, Sparkles, Users } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { authenticated } = usePrivy();

  // Fetch real coin statistics
  const { data: coinStats } = useQuery({
    queryKey: ["/api/zora/coins/top-volume"],
    queryFn: async () => {
      const response = await fetch("/api/zora/coins/top-volume?count=100");
      if (!response.ok) throw new Error("Failed to fetch coin stats");
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const totalCoins = coinStats?.coins?.length || 0;
  const totalMarketCap = coinStats?.coins?.reduce((sum: number, coin: any) => {
    return sum + (parseFloat(coin.marketCap) || 0);
  }, 0) || 0;


  const navItems = [
    { emoji: "🧭", label: "Feed", path: "/", testId: "nav-feed" },
    { emoji: "🔍", label: "Search", path: "/search", testId: "nav-search" },
    { emoji: "➕", label: "Create", path: "/create", testId: "nav-create" },
    { emoji: "💬", label: "Inbox", path: "/inbox", testId: "nav-inbox", requireAuth: true },
    { emoji: "👤", label: "Profile", path: "/profile", testId: "nav-profile" },
  ];

  const secondaryNavItems = [
    { emoji: "🤝", label: "Connections", path: "/connections", requireAuth: true },
    { emoji: "🌟", label: "Creators", path: "/creators" },
    { emoji: "👥", label: "Groups", path: "/groups" },
    { emoji: "🔥", label: "Streaks", path: "/streaks", requireAuth: true },
    { emoji: "⚡", label: "Admin", path: "/admin" },
  ];

  const resourceItems = [
    { emoji: "📖", label: "Docs", path: "/docs", testId: "nav-docs" },
    { emoji: "❓", label: "FAQ", path: "/faq", testId: "nav-faq" },
  ];

  const isAdminRoute = typeof location === 'string' && (location === '/admin' || location.startsWith('/admin/'));

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen">
        {/* Desktop Sidebar (hidden on admin routes) */}
        {!isAdminRoute && (
          <Sidebar className="hidden md:flex" collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border h-16 flex items-center px-4">
            <Link href="/" className="flex items-center">
              <h1 className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
                creatorland<span className="text-primary">*</span>
              </h1>
              <span className="hidden group-data-[collapsible=icon]:block text-xl font-bold text-primary">
                *
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-2 py-4">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {navItems
                    .filter(item => !item.requireAuth || authenticated)
                    .map((item) => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.label}
                            className="w-full justify-start py-2"
                          >
                            <Link href={item.path} data-testid={item.testId} className="flex items-center gap-3">
                              <span className="text-lg shrink-0">{item.emoji}</span>
                              <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="px-2 text-xs uppercase tracking-wider group-data-[collapsible=icon]:hidden">More</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {secondaryNavItems
                    .filter(item => !item.requireAuth || authenticated)
                    .map((item) => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.label}
                            className="w-full justify-start py-2"
                          >
                            <Link href={item.path} className="flex items-center gap-3">
                              <span className="text-lg shrink-0">{item.emoji}</span>
                              <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-4">
              <SidebarGroupLabel className="px-2 text-xs uppercase tracking-wider group-data-[collapsible=icon]:hidden">Resources</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {resourceItems.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className="w-full justify-start py-2"
                        >
                          <Link href={item.path} className="flex items-center gap-3">
                            <span className="text-lg shrink-0">{item.emoji}</span>
                            <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          </Sidebar>
        )}

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col w-full">
          {/* Top Navigation - Desktop (hidden on admin routes) */}
          {!isAdminRoute && (
            <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="flex h-16 items-center justify-between px-4 max-w-5xl mx-auto w-full gap-4">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="hidden md:flex" />
                <Link href="/" data-testid="link-logo" className="md:hidden">
                  <h1 className="text-2xl font-bold tracking-tight">
                    creatorland<span className="text-primary">*</span>
                  </h1>
                </Link>
              </div>

              {/* Desktop Search Bar */}
              <div className="hidden md:flex flex-1 max-w-2xl items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search creators, projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                      }
                    }}
                    className="pl-9 h-9 text-sm bg-muted/50"
                    data-testid="header-search"
                  />
                </div>

                {/* Stats Display */}
                <div className="hidden lg:flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Coins:</span>
                    <span className="font-semibold">{totalCoins}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-accent" />
                    <span className="text-muted-foreground">MC:</span>
                    <span className="font-semibold">
                      ${totalMarketCap >= 1000000
                        ? `${(totalMarketCap / 1000000).toFixed(2)}M`
                        : totalMarketCap >= 1000
                        ? `${(totalMarketCap / 1000).toFixed(2)}K`
                        : totalMarketCap.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ThemeToggle />
                <div data-tour="notification-bell">
                  <NotificationBell />
                </div>
                <div data-tour="user-menu">
                  <UserMenu />
                </div>
              </div>
              </div>
            </header>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto max-w-5xl">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation (hidden on admin routes) */}
          {!isAdminRoute && (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <div className="flex items-center justify-around h-14">
              {navItems
                .filter(item => !item.requireAuth || authenticated)
                .map((item) => {
                  const isActive = location === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      data-tour={item.testId}
                    >
                      <button
                        className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="text-xl">{item.emoji}</span>
                        <span className="text-xs">{item.label}</span>
                      </button>
                    </Link>
                  );
                })}
            </div>
            </nav>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
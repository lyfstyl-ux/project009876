import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, PlusCircle, User, TrendingUp, Coins, Compass } from "lucide-react";
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

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const { authenticated } = usePrivy();

  const { data: stats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

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

  return (
    <SidebarProvider>
      <div className="flex w-full h-screen">
        {/* Desktop Sidebar */}
        <Sidebar className="hidden md:flex w-64">
          <SidebarHeader className="border-b border-sidebar-border">
            <Link href="/" className="flex items-center px-2 py-1">
              <h1 className="text-xl font-bold tracking-tight group-data-[collapsible=icon]:hidden">
                creatorland<span className="text-primary">*</span>
              </h1>
              <span className="hidden group-data-[collapsible=icon]:block text-2xl font-bold text-primary">
                *
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
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
                            className="w-full justify-start"
                          >
                            <Link href={item.path} data-testid={item.testId} className="flex items-center gap-3">
                              <span className="text-xl shrink-0">{item.emoji}</span>
                              <span className="flex-1">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-2">More</SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
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
                            className="w-full justify-start"
                          >
                            <Link href={item.path} className="flex items-center gap-3">
                              <span className="text-xl shrink-0">{item.emoji}</span>
                              <span className="flex-1">{item.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-2">Resources</SidebarGroupLabel>
              <SidebarGroupContent className="px-2">
                <SidebarMenu>
                  {resourceItems.map((item) => {
                    const isActive = location === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          tooltip={item.label}
                          className="w-full justify-start"
                        >
                          <Link href={item.path} className="flex items-center gap-3">
                            <span className="text-xl shrink-0">{item.emoji}</span>
                            <span className="flex-1">{item.label}</span>
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

        {/* Main Content Area */}
        <SidebarInset className="flex flex-col w-full">
          {/* Top Navigation - Desktop */}
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
                <div className="hidden lg:flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50">
                    <Coins className="h-3.5 w-3.5 text-primary" />
                    <span className="text-muted-foreground">Coins:</span>
                    <span className="font-semibold text-foreground">{stats?.totalCoins || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/30 border border-border/50">
                    <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-muted-foreground">MC:</span>
                    <span className="font-semibold text-foreground">$0</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <NotificationBell />
                <ThemeToggle />
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto max-w-5xl">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
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
                      data-testid={item.testId}
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
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
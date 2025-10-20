import { Link, useLocation } from "wouter";
import { Home, Search, PlusCircle, MessageCircle, User } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: "Feed", path: "/", testId: "nav-feed" },
    { icon: Search, label: "Search", path: "/search", testId: "nav-search" },
    { icon: PlusCircle, label: "Create", path: "/create", testId: "nav-create" },
    { icon: MessageCircle, label: "Inbox", path: "/inbox", testId: "nav-inbox" },
    { icon: User, label: "Profile", path: "/profile", testId: "nav-profile" },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Navigation - Desktop */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between px-4 max-w-7xl mx-auto">
          <Link href="/" data-testid="link-logo">
            <h1 className="text-2xl font-bold tracking-tight">
              creatorland<span className="text-primary">*</span>
            </h1>
          </Link>

          <div className="flex items-center gap-4">
            <ThemeToggle />
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
          {navItems.map((item) => {
            const Icon = item.icon;
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
                  <Icon className="h-5 w-5" />
                  <span className="text-xs">{item.label}</span>
                </button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
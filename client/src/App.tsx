import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme-provider";
import { AppLayout } from "@/components/app-layout";

// Pages
import Home from "@/pages/home";
import Search from "@/pages/search";
import Profile from "@/pages/profile";
import Create from "@/pages/create";
import Inbox from "@/pages/inbox";
import Connections from "@/pages/connections";
import Groups from "@/pages/groups";
import Streaks from "@/pages/streaks";
import Admin from "@/pages/admin";
import Creators from "@/pages/creators";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/search" component={Search} />
        <Route path="/profile/:id?" component={Profile} />
        <Route path="/create" component={Create} />
        <Route path="/inbox" component={Inbox} />
        <Route path="/connections" component={Connections} />
        <Route path="/groups" component={Groups} />
        <Route path="/streaks" component={Streaks} />
        <Route path="/admin" component={Admin} />
        <Route path="/creators" component={Creators} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

import { AppPrivyProvider } from "@/lib/privy-provider";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppPrivyProvider>
        <ThemeProvider defaultTheme="dark">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AppPrivyProvider>
    </QueryClientProvider>
  );
}

export default App;
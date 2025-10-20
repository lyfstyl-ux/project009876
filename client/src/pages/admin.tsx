import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, DollarSign, TrendingUp, Users, Coins, Activity, BarChart3, BellRing, Settings, Wallet, EyeOff, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationTestingPanel } from "@/components/notification-testing-panel";

const PLATFORM_FEE_ADDRESS = "0xf25af781c4F1Df40Ac1D06e6B80c17815AD311F7";

export default function Admin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [notifType, setNotifType] = useState("points_earned");
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [targetAddress, setTargetAddress] = useState("");

  const { data: stats, isLoading: isLoadingStats } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/creators"],
  });

  const { data: coins = [], isLoading: isLoadingCoins } = useQuery<any[]>({
    queryKey: ["/api/coins"],
  });

  const sendNotificationMutation = useMutation({
    mutationFn: async (data: { type: string; title: string; message: string; address: string }) => {
      const response = await apiRequest("POST", "/api/notifications/send-test", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Notification Sent",
        description: "Notification has been sent successfully",
      });
      setNotifTitle("");
      setNotifMessage("");
      setTargetAddress("");
    },
    onError: (error: Error) => {
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hideCoinMutation = useMutation({
    mutationFn: async (coinId: string) => {
      const response = await apiRequest("POST", `/api/admin/hide-coin/${coinId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Coin Hidden",
        description: "The coin has been hidden from the frontend",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coins"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const showCoinMutation = useMutation({
    mutationFn: async (coinId: string) => {
      const response = await apiRequest("POST", `/api/admin/show-coin/${coinId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Coin Shown",
        description: "The coin is now visible on the frontend",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/coins"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendNotification = () => {
    if (!notifTitle || !notifMessage) {
      toast({
        title: "Missing Fields",
        description: "Please fill in title and message",
        variant: "destructive",
      });
      return;
    }

    sendNotificationMutation.mutate({
      type: notifType,
      title: notifTitle,
      message: notifMessage,
      address: targetAddress || "all",
    });
  };

  const menuItems = [
    { id: 'overview', icon: BarChart3, label: 'Overview' },
    { id: 'earnings', icon: DollarSign, label: 'Earnings' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'coins', icon: Coins, label: 'Coins' },
    { id: 'notifications', icon: BellRing, label: 'Notifications' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  const activeCoins = coins.filter((c: any) => c.status === 'active').length;
  const pendingCoins = coins.filter((c: any) => c.status === 'pending').length;
  const hiddenCoins = coins.filter((c: any) => c.hidden === true).length;

  return (
    <div className="flex h-full">
      <div className="w-64 border-r border-border/40 bg-muted/10 p-4 space-y-2">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-foreground mb-1">Admin</h1>
          <div className="flex items-center gap-2 text-xs text-green-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live Dashboard
          </div>
        </div>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all",
              activeTab === item.id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "text-muted-foreground hover-elevate active-elevate-2"
            )}
            data-testid={`button-tab-${item.id}`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                  Platform Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Platform Fee Address</div>
                    <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                      <code className="text-xs font-mono text-foreground flex-1 truncate">
                        {PLATFORM_FEE_ADDRESS}
                      </code>
                      <a
                        href={`https://basescan.org/address/${PLATFORM_FEE_ADDRESS}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 transition-colors"
                        title="View on BaseScan"
                      >
                        <Wallet className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                    <div className="text-right">
                      <div className="text-lg sm:text-2xl font-bold text-foreground">
                        {isLoadingUsers ? '...' : users.length}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Total Users</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                    <div className="text-right">
                      <div className="text-lg sm:text-2xl font-bold text-foreground">
                        {isLoadingCoins ? '...' : coins.length}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Total Coins</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                    <div className="text-right">
                      <div className="text-lg sm:text-2xl font-bold text-foreground">
                        {activeCoins}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Active Coins</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/20">
                <CardHeader className="p-3 sm:p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                    <div className="text-right">
                      <div className="text-lg sm:text-2xl font-bold text-foreground">
                        ${stats?.totalVolume || '0.00'}
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">24h Volume</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <Card className="bg-muted/20">
                <CardContent className="p-2 sm:p-3">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-green-500">{activeCoins}</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground">Active</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/20">
                <CardContent className="p-2 sm:p-3">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-yellow-500">{pendingCoins}</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground">Pending</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/20">
                <CardContent className="p-2 sm:p-3">
                  <div className="text-center">
                    <div className="text-base sm:text-lg font-bold text-red-500">{hiddenCoins}</div>
                    <div className="text-[9px] sm:text-[10px] text-muted-foreground">Hidden</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Earnings</CardTitle>
                <CardDescription>Real-time platform revenue and fee tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-500">
                      ${stats?.totalEarnings || '0.00'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Platform Fees</p>
                    <p className="text-2xl font-bold text-blue-500">
                      ${stats?.platformFees || '0.00'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Trade Fees</p>
                    <p className="text-2xl font-bold text-purple-500">
                      ${stats?.tradeFees || '0.00'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {isLoadingUsers ? (
                      <p className="text-center text-muted-foreground py-8">Loading users...</p>
                    ) : users.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No users found</p>
                    ) : (
                      users.map((user: any) => (
                        <div key={user.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover-elevate">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.displayName || user.username || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">
                                {user.id?.slice(0, 6)}...{user.id?.slice(-4)}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary">{user.creatorType || 'User'}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'coins' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Coin Management</CardTitle>
                <CardDescription>Manage coin visibility and status</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-3">
                    {isLoadingCoins ? (
                      <p className="text-center text-muted-foreground py-8">Loading coins...</p>
                    ) : coins.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No coins found</p>
                    ) : (
                      coins.map((coin: any) => (
                        <div key={coin.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover-elevate">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                              {coin.image ? (
                                <img src={coin.image} alt={coin.name} className="w-full h-full object-cover" />
                              ) : (
                                <Coins className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{coin.name}</p>
                              <p className="text-xs text-muted-foreground">{coin.symbol}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={coin.status === 'active' ? 'default' : 'secondary'}>
                              {coin.status}
                            </Badge>
                            {coin.hidden && (
                              <Badge variant="destructive">Hidden</Badge>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => coin.hidden ? showCoinMutation.mutate(coin.id) : hideCoinMutation.mutate(coin.id)}
                              disabled={hideCoinMutation.isPending || showCoinMutation.isPending}
                              data-testid={`button-toggle-${coin.id}`}
                            >
                              {coin.hidden ? (
                                <Eye className="w-4 h-4" />
                              ) : (
                                <EyeOff className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Notifications</CardTitle>
                <CardDescription>Send test notifications to users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notif-type">Notification Type</Label>
                  <Select value={notifType} onValueChange={setNotifType}>
                    <SelectTrigger id="notif-type" data-testid="select-notif-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="points_earned">Points Earned</SelectItem>
                      <SelectItem value="trade_completed">Trade Completed</SelectItem>
                      <SelectItem value="milestone_reached">Milestone Reached</SelectItem>
                      <SelectItem value="new_follower">New Follower</SelectItem>
                      <SelectItem value="system_alert">System Alert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notif-title">Title</Label>
                  <Input
                    id="notif-title"
                    value={notifTitle}
                    onChange={(e) => setNotifTitle(e.target.value)}
                    placeholder="Enter notification title"
                    data-testid="input-notif-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notif-message">Message</Label>
                  <Textarea
                    id="notif-message"
                    value={notifMessage}
                    onChange={(e) => setNotifMessage(e.target.value)}
                    placeholder="Enter notification message"
                    rows={3}
                    data-testid="input-notif-message"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-address">Target Address (leave empty for all users)</Label>
                  <Input
                    id="target-address"
                    value={targetAddress}
                    onChange={(e) => setTargetAddress(e.target.value)}
                    placeholder="0x... or leave empty for all"
                    data-testid="input-target-address"
                  />
                </div>

                <Button
                  onClick={handleSendNotification}
                  disabled={sendNotificationMutation.isPending}
                  className="w-full"
                  data-testid="button-send-notification"
                >
                  {sendNotificationMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <BellRing className="w-4 h-4 mr-2" />
                      Send Test Notification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
                <CardDescription>Configure platform-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <NotificationTestingPanel />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
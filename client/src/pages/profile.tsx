import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { useLocation } from "wouter";
import type { Coin } from "@shared/schema";
import Layout from "@/components/layout";
import { CoinCard } from "@/components/coin-card";
import {
  User as UserIcon,
  Share2,
  Grid3x3,
  List,
  Copy,
  Check,
  TrendingUp,
  Edit2,
  Users,
  Coins as CoinsIcon,
  Settings as SettingsIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCoin } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatSmartCurrency } from "@/lib/utils";

export default function Profile() {
  const { user: privyUser, authenticated } = usePrivy();
  const [selectedTab, setSelectedTab] = useState<"created" | "owned">("created");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [copied, setCopied] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [totalMarketCap, setTotalMarketCap] = useState<number>(0);
  const [totalHolders, setTotalHolders] = useState<number>(0);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [shareUrl, setShareUrl] = useState<string>("");

  // Get wallet address from Privy
  const address = privyUser?.wallet?.address;

  const avatarSvg = createAvatar(avataaars, {
    seed: address || 'anonymous',
    size: 128,
  }).toDataUri();

  // Fetch creator data to populate username and bio
  const { data: creatorData, isLoading: isLoadingCreatorData } = useQuery({
    queryKey: ['/api/creators/address', address],
    enabled: !!address && authenticated,
  });

  const { data: coins = [], isLoading: isLoadingCoins } = useQuery<Coin[]>({
    queryKey: ["/api/coins"],
  });

  const createdCoins = useMemo(() => {
    if (!address) return [];
    return coins.filter(coin =>
      coin.creatorWallet && coin.creatorWallet.toLowerCase() === address.toLowerCase()
    );
  }, [coins, address]);

  const ownedCoins = useMemo(() => {
    return [];
  }, []);

  const displayedCoins = selectedTab === "created"
    ? createdCoins.filter(coin => coin.address !== null) as Array<typeof createdCoins[0] & { address: string }>
    : ownedCoins;

  useEffect(() => {
    if (!address || !authenticated || !createdCoins.length) {
      setTotalEarnings(0);
      setTotalMarketCap(0);
      setTotalHolders(0);
      setIsLoadingStats(false);
      return;
    }

    let isMounted = true;
    setIsLoadingStats(true);

    async function fetchAllStats() {
      try {
        let earnings = 0;
        let marketCap = 0;
        let holders = 0;

        for (const coin of createdCoins) {
          if (coin.address && coin.status === 'active') {
            try {
              const coinData = await getCoin({
                collectionAddress: coin.address as `0x${string}`,
                chainId: base.id,
              });

              const tokenData = coinData.data?.zora20Token;

              if (tokenData?.creatorEarnings && tokenData.creatorEarnings.length > 0) {
                const earningAmount = parseFloat(String(tokenData.creatorEarnings[0].amountUsd || tokenData.creatorEarnings[0].amount?.amountDecimal || "0"));
                earnings += earningAmount;
              }

              if (tokenData?.marketCap) {
                marketCap += parseFloat(tokenData.marketCap);
              }

              if (tokenData?.uniqueHolders) {
                holders += tokenData.uniqueHolders;
              }
            } catch (err) {
              console.error(`Error fetching coin stats for ${coin.address}:`, err);
            }
          }
        }

        if (isMounted) {
          setTotalEarnings(earnings);
          setTotalMarketCap(marketCap);
          setTotalHolders(holders);
          setIsLoadingStats(false);
        }
      } catch (error) {
        console.error("Error fetching creator stats:", error);
        if (isMounted) {
          setTotalEarnings(0);
          setTotalMarketCap(0);
          setTotalHolders(0);
          setIsLoadingStats(false);
        }
      }
    }

    fetchAllStats();

    return () => {
      isMounted = false;
    };
  }, [address, authenticated, createdCoins]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleCopyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy address to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    if (!address) return;
    const url = shareUrl || `${window.location.origin}/profile/${address}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${creatorData?.name || formatAddress(address)} - CoinIT Profile`,
          text: `Check out my profile on CoinIT!`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link copied",
          description: "Profile link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileImage(file);

      setIsUploadingImage(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        setProfileImageUrl(data.url);

        toast({
          title: "Image uploaded",
          description: "Profile image uploaded successfully",
        });
      } catch (error) {
        console.error('Image upload error:', error);
        toast({
          title: "Upload failed",
          description: "Failed to upload profile image",
          variant: "destructive",
        });
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  useEffect(() => {
    if (creatorData) {
      setUsername(creatorData.name || '');
      setBio(creatorData.bio || '');
      setProfileImageUrl(creatorData.avatar || '');
    }
  }, [creatorData]);

  useEffect(() => {
    if (address) {
      const profilePath = creatorData?.name 
        ? `/@${creatorData.name}` 
        : `/profile/${address}`;
      const profileUrl = `${window.location.origin}${profilePath}`;
      setShareUrl(profileUrl);
    }
  }, [address, creatorData]);

  const handleSaveProfile = async () => {
    if (!address) return;

    try {
      let creator = creatorData;

      if (!creator) {
        const createResponse = await apiRequest('POST', '/api/creators', {
          address,
          name: username || null,
          bio: bio || null,
          avatar: profileImageUrl || null,
        });
        creator = await createResponse.json();
      } else {
        const updateResponse = await apiRequest('PATCH', `/api/creators/${creator.id}`, {
          name: username || null,
          bio: bio || null,
          avatar: profileImageUrl || null,
        });
        creator = await updateResponse.json();
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/creators/address'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/creators'] });
      await queryClient.invalidateQueries({ queryKey: ["/api/coins"] });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });

      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (!authenticated) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh] p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2" data-testid="text-connect-wallet">Connect Your Wallet</h2>
            <p className="text-muted-foreground">
              Please connect your wallet to view your profile
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoadingCreatorData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted/20 rounded-full animate-pulse mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="relative mb-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-4">
              <img
                src={profileImageUrl || avatarSvg}
                alt="Profile Avatar"
                className="w-28 h-28 rounded-3xl border-4 border-border shadow-xl object-cover"
                data-testid="img-profile-avatar"
              />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-1" data-testid="text-username">
              {creatorData?.name || formatAddress(address || '')}
            </h1>

            <p className="text-sm text-muted-foreground mb-4" data-testid="text-address">
              @{address ? `${address.slice(2, 8)}` : ''}
            </p>

            {creatorData?.bio && (
              <p className="text-muted-foreground text-sm mb-4 max-w-md px-4" data-testid="text-bio">
                {creatorData.bio}
              </p>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground mb-1" data-testid="text-coins-count">
                {isLoadingStats || isLoadingCoins ? '-' : createdCoins.length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Coins</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-foreground mb-1" data-testid="text-market-cap">
                {isLoadingStats ? '-' : totalMarketCap >= 1000000
                  ? `$${(totalMarketCap / 1000000).toFixed(2)}M`
                  : totalMarketCap >= 1000
                    ? `$${(totalMarketCap / 1000).toFixed(1)}k`
                    : `$${totalMarketCap.toFixed(2)}`}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Market Cap</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-foreground mb-1" data-testid="text-holders">
                {isLoadingStats ? '-' : totalHolders}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Holders</div>
            </div>

            <div className="text-center">
              <div className="text-xl font-bold text-green-600 dark:text-green-500 mb-1" data-testid="text-earnings">
                {isLoadingStats ? '-' : formatSmartCurrency(totalEarnings)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">Earnings</div>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold rounded-xl h-11"
              data-testid="button-edit-profile"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>

            <Button
              onClick={handleShare}
              variant="outline"
              className="flex-1 rounded-xl h-11"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            <Button
              onClick={handleCopyAddress}
              variant="outline"
              size="icon"
              className="rounded-xl h-11 w-11"
              data-testid="button-copy-address"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground" data-testid="text-created-coins-title">
            Created Coins {createdCoins.length > 0 && `(${createdCoins.length})`}
          </h2>

          <div className="flex gap-1 bg-muted/20 rounded-full p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-full transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-black dark:bg-white dark:text-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-view-grid"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-full transition-colors ${
                viewMode === "list"
                  ? "bg-white text-black dark:bg-white dark:text-black"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              data-testid="button-view-list"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isLoadingCoins ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="spotify-card rounded-xl overflow-hidden p-3 space-y-3">
                <div className="aspect-square w-full bg-muted/20 rounded-lg animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : displayedCoins.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CoinsIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-no-coins">No coins created yet</h3>
            <p className="text-muted-foreground">Start creating your first coin!</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-4"}>
            {displayedCoins.map((coin) => (
              <CoinCard
                key={coin.id}
                coin={{
                  ...coin,
                  createdAt: typeof coin.createdAt === 'string'
                    ? coin.createdAt
                    : coin.createdAt
                      ? coin.createdAt.toISOString()
                      : new Date().toISOString(),
                  ipfsUri: coin.ipfsUri ?? undefined
                }}
                isOwnCoin={true}
              />
            ))}
          </div>
        )}
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Profile Image</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isUploadingImage}
                data-testid="input-profile-image"
              />
              {isUploadingImage && (
                <p className="text-xs text-muted-foreground mt-1">Uploading...</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                data-testid="input-username"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Bio</label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                data-testid="input-bio"
              />
            </div>

            <Button
              onClick={handleSaveProfile}
              className="w-full"
              data-testid="button-save-profile"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

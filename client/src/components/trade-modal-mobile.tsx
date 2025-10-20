
import { useState, useEffect } from "react";
import type { Coin, Comment } from "@shared/schema";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatEther } from "viem";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCoin, getCoinHolders } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  CheckCircle2, 
  ExternalLink, 
  MessageCircle, 
  Coins, 
  Users, 
  ActivityIcon,
  TrendingUp,
  Copy,
  Check,
  X,
  Info
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatSmartCurrency } from "@/lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type CoinProp = {
  id: string;
  name: string;
  symbol: string;
  address: string;
  image?: string;
  marketCap?: string;
  volume24h?: string;
  holders?: number;
  creator?: string;
  createdAt?: string;
  category?: string;
  platform?: string;
  creator_wallet?: string;
  metadata?: any;
  type?: string;
};

interface MobileTradeModalProps {
  coin: CoinProp;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileTradeModal({ coin, open, onOpenChange }: MobileTradeModalProps) {
  const { toast } = useToast();
  const [ethAmount, setEthAmount] = useState("0.001");
  const [isTrading, setIsTrading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(true);
  const [standaloneComment, setStandaloneComment] = useState("");
  const [balance, setBalance] = useState<string>("0");
  const [marketCap, setMarketCap] = useState<string | null>(null);
  const [volume24h, setVolume24h] = useState<string | null>(null);
  const [creatorEarnings, setCreatorEarnings] = useState<string | null>(null);
  const [coinImage, setCoinImage] = useState<string | null>(null);
  const [holders, setHolders] = useState<Array<{
    address: string;
    balance: string;
    percentage: number;
    profile?: string | null;
  }>>([]);
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([]);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [totalSupply, setTotalSupply] = useState<string | null>(null);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['/api/comments/coin', coin.address],
    enabled: open && !!coin.address,
  });

  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { coinAddress: string; userAddress: string; comment: string; transactionHash?: string }) => {
      return await apiRequest('POST', '/api/comments', commentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/comments/coin', coin.address] });
    },
  });

  const handleStandaloneComment = async () => {
    if (!isConnected || !address || !coin.address || !standaloneComment.trim()) return;

    try {
      await createCommentMutation.mutateAsync({
        coinAddress: coin.address,
        userAddress: address,
        comment: standaloneComment.trim(),
      });
      setStandaloneComment("");
      toast({ title: "Comment added", description: "Your comment has been posted" });
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast({ title: "Failed to post comment", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  useEffect(() => {
    async function fetchBalance() {
      if (!address || !publicClient) return;
      try {
        const bal = await publicClient.getBalance({ address });
        setBalance(formatEther(bal));
      } catch (error) {
        console.error("Error fetching balance:", error);
      }
    }
    if (isConnected && open) fetchBalance();
  }, [address, isConnected, publicClient, open]);

  useEffect(() => {
    async function fetchCoinStats() {
      if (!coin.address) return;
      try {
        const response = await getCoin({
          address: coin.address as `0x${string}`,
          chain: base.id,
        });

        const coinData = response.data?.zora20Token;
        if (coinData) {
          // Market Cap
          if (coinData.marketCap !== null && coinData.marketCap !== undefined) {
            const mcValue = typeof coinData.marketCap === 'string' ? parseFloat(coinData.marketCap) : coinData.marketCap;
            setMarketCap(mcValue.toFixed(2));
          }
          
          // Volume 24h
          if (coinData.volume24h !== null && coinData.volume24h !== undefined) {
            const volValue = typeof coinData.volume24h === 'string' ? parseFloat(coinData.volume24h) : coinData.volume24h;
            setVolume24h(volValue.toString());
            setCreatorEarnings((volValue * 0.005).toString());
          }
          
          // Total Supply
          if (coinData.totalSupply) {
            setTotalSupply(coinData.totalSupply);
          }
          
          // Current Price
          if (coinData.price) {
            setCurrentPrice(coinData.price);
          }
          
          // Price Change 24h
          if (coinData.priceChange24h !== null && coinData.priceChange24h !== undefined) {
            setPriceChange24h(typeof coinData.priceChange24h === 'string' 
              ? parseFloat(coinData.priceChange24h) 
              : coinData.priceChange24h);
          }
          
          // Coin Image
          if (coinData.mediaContent?.previewImage) {
            const previewImage = coinData.mediaContent.previewImage as any;
            setCoinImage(previewImage.medium || previewImage.small || null);
          }
        }

        const holdersResponse = await getCoinHolders({
          chainId: base.id,
          address: coin.address as `0x${string}`,
          count: 20,
        });

        const holderBalances = holdersResponse.data?.zora20Token?.tokenBalances?.edges || [];
        const supply = parseFloat(coinData?.totalSupply || "0");

        if (holderBalances.length > 0 && supply > 0) {
          const processedHolders = holderBalances.map((edge: any) => {
            const balance = parseFloat(edge.node.balance || "0");
            return {
              address: edge.node.ownerAddress,
              balance: edge.node.balance,
              percentage: (balance / supply) * 100,
              profile: edge.node.ownerProfile?.handle || null,
            };
          });
          setHolders(processedHolders);
        }
      } catch (error) {
        console.error("Error fetching coin stats:", error);
      }
    }
    if (open) fetchCoinStats();
  }, [coin.address, open]);

  const handleTrade = async () => {
    if (!isConnected || !address || !walletClient || !publicClient) {
      toast({ title: "Wallet not connected", description: "Please connect your wallet first", variant: "destructive" });
      return;
    }

    const ethAmountNum = parseFloat(ethAmount);
    if (!ethAmount || ethAmountNum <= 0) {
      toast({ title: "Invalid amount", description: "Please enter a valid ETH amount", variant: "destructive" });
      return;
    }

    setIsTrading(true);
    try {
      const { tradeZoraCoin } = await import("@/lib/zora");
      const result = await tradeZoraCoin({
        coinAddress: coin.address as `0x${string}`,
        ethAmount,
        walletClient,
        publicClient,
        userAddress: address,
        isBuying,
      });

      if (result?.hash) {
        setTxHash(result.hash);
        toast({ title: "Trade successful!", description: `You ${isBuying ? 'bought' : 'sold'} ${coin.symbol} tokens` });
        const newBal = await publicClient.getBalance({ address });
        setBalance(formatEther(newBal));
      }
    } catch (error) {
      console.error("Trade failed:", error);
      toast({ title: "Trade failed", description: error instanceof Error ? error.message : "Trade failed", variant: "destructive" });
    } finally {
      setIsTrading(false);
    }
  };

  const formatAddress = (address?: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const setQuickAmount = (amount: string) => {
    if (amount === 'Max') {
      setEthAmount((parseFloat(balance) * 0.9).toFixed(6));
    } else {
      setEthAmount(amount);
    }
  };

  const displayImage = coinImage || coin?.image || coin?.metadata?.image;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92vh] bg-background border-t-2 border-border">
        {/* Header with coin info */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <DrawerHeader className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                  {displayImage ? (
                    <img src={displayImage} alt={coin.name} className="w-full h-full object-cover" />
                  ) : (
                    <Coins className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <DrawerTitle className="text-lg font-bold">{coin.name}</DrawerTitle>
                  <p className="text-sm text-muted-foreground">@{coin.symbol}</p>
                </div>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 px-4 pb-3">
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">Market Cap</p>
              <p className="text-sm font-bold text-green-500">${marketCap || '0'}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">24H Volume</p>
              <p className="text-sm font-semibold">{volume24h ? formatSmartCurrency(parseFloat(volume24h)) : '0'}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-2 text-center">
              <p className="text-xs text-muted-foreground">Holders</p>
              <p className="text-sm font-semibold">{holders.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="trade" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full grid grid-cols-4 mx-4 mt-3 mb-2 bg-muted/30">
            <TabsTrigger value="trade" className="text-xs">Trade</TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">Chat</TabsTrigger>
            <TabsTrigger value="holders" className="text-xs">Holders</TabsTrigger>
            <TabsTrigger value="details" className="text-xs">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="trade" className="flex-1 px-4 pb-6 overflow-y-auto mt-0">
            <div className="space-y-4">
              {/* Buy/Sell Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setIsBuying(true)}
                  className={`h-12 ${isBuying ? 'bg-green-500 hover:bg-green-600' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
                  disabled={isTrading || !!txHash}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Buy
                </Button>
                <Button
                  onClick={() => setIsBuying(false)}
                  className={`h-12 ${!isBuying ? 'bg-red-500 hover:bg-red-600' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
                  disabled={isTrading || !!txHash}
                >
                  <TrendingUp className="w-4 h-4 mr-2 rotate-180" />
                  Sell
                </Button>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (ETH)</label>
                <Input
                  type="number"
                  value={ethAmount}
                  onChange={(e) => setEthAmount(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="0.0"
                  disabled={isTrading || !!txHash}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Balance: {parseFloat(balance).toFixed(4)} ETH</span>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['0.001', '0.01', '0.1', 'Max'].map((label) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    onClick={() => setQuickAmount(label)}
                    disabled={isTrading || !!txHash}
                    className="h-9"
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {/* Trade Button */}
              <Button
                onClick={handleTrade}
                disabled={isTrading || !isConnected || !!txHash}
                className="w-full h-12 text-base font-semibold"
              >
                {isTrading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Trading...
                  </>
                ) : (
                  `${isBuying ? 'Buy' : 'Sell'} ${coin.symbol}`
                )}
              </Button>

              {/* Success Message */}
              {txHash && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-green-500">Trade Successful!</span>
                  </div>
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary flex items-center gap-1"
                  >
                    View on BaseScan
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="comments" className="flex-1 px-4 pb-6 overflow-hidden mt-0 flex flex-col">
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Add a comment..."
                value={standaloneComment}
                onChange={(e) => setStandaloneComment(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleStandaloneComment} size="icon" className="shrink-0">
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 -mx-4 px-4">
              {comments.length > 0 ? (
                <div className="space-y-2">
                  {comments.map((c) => (
                    <div key={c.id} className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{formatAddress(c.userAddress)}</p>
                      <p className="text-sm">{c.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="holders" className="flex-1 px-4 pb-6 overflow-y-auto mt-0">
            <ScrollArea className="flex-1 -mx-4">
              {holders.length > 0 ? (
                <div className="space-y-1 px-4">
                  {holders.map((holder, idx) => (
                    <div key={holder.address} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <span className="text-xs font-bold">#{idx + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{holder.profile || formatAddress(holder.address)}</p>
                          {holder.profile && <p className="text-xs text-muted-foreground">{formatAddress(holder.address)}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{holder.percentage.toFixed(2)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No holders data available</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="details" className="flex-1 px-4 pb-6 overflow-y-auto mt-0">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ActivityIcon className="w-4 h-4" />
                  <span className="text-sm">Created</span>
                </div>
                <span className="text-sm font-medium">{coin.createdAt ? new Date(coin.createdAt).toLocaleDateString() : 'Unknown'}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Contract</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono">{formatAddress(coin.address)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => copyToClipboard(coin.address)}
                  >
                    {copiedAddress ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm">Chain</span>
                </div>
                <span className="text-sm font-medium flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  Base
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <span className="text-sm">Creator Earnings</span>
                </div>
                <span className="text-sm font-medium">{creatorEarnings ? formatSmartCurrency(parseFloat(creatorEarnings)) : '0'}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}

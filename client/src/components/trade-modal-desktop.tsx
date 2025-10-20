
import { useState, useEffect } from "react";
import type { Coin, Comment } from "@shared/schema";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ExternalLink, Coins, MessageCircle, Users, Activity as ActivityIcon, Info, Copy, Check, TrendingUp } from "lucide-react";
import { getCoin, getCoinHolders } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import { formatEther } from "viem";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { formatSmartCurrency } from "@/lib/utils";

interface TradeModalDesktopProps {
  coin: Coin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TradeModalDesktop({ coin, open, onOpenChange }: TradeModalDesktopProps) {
  const { toast } = useToast();
  const [ethAmount, setEthAmount] = useState("0.000111");
  const [isTrading, setIsTrading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(true);
  const [comment, setComment] = useState("");
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
  const [totalSupply, setTotalSupply] = useState<string | null>(null);
  const [uniqueHoldersCount, setUniqueHoldersCount] = useState<number>(0);
  const [chartData, setChartData] = useState<Array<{ time: string; price: number }>>([]);
  const [timeframe, setTimeframe] = useState<'1H' | '1D' | 'W' | 'M' | 'All'>('1D');
  const [priceChange, setPriceChange] = useState<number>(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselApi, setCarouselApi] = useState<any>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    carouselApi.on("select", onSelect);
    return () => carouselApi.off("select", onSelect);
  }, [carouselApi]);

  const { data: comments = [], isLoading: commentsLoading } = useQuery<Comment[]>({
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

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
      toast({ title: "Failed to post comment", description: "Please try again", variant: "destructive" });
    }
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
          if (coinData.marketCap !== null && coinData.marketCap !== undefined) {
            const mcValue = typeof coinData.marketCap === 'string' ? parseFloat(coinData.marketCap) : coinData.marketCap;
            setMarketCap(mcValue.toFixed(2));
          }
          if (coinData.volume24h !== null && coinData.volume24h !== undefined) {
            const volValue = typeof coinData.volume24h === 'string' ? parseFloat(coinData.volume24h) : coinData.volume24h;
            setVolume24h(volValue.toString());
            setCreatorEarnings((volValue * 0.005).toString());
          }
          if (coinData.mediaContent?.previewImage) {
            const previewImage = coinData.mediaContent.previewImage as any;
            setCoinImage(previewImage.medium || previewImage.small || null);
          }
        }

        const holdersResponse = await getCoinHolders({
          chainId: base.id,
          address: coin.address as `0x${string}`,
          count: 50,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] bg-card/95 backdrop-blur-sm border-border/50 p-0 overflow-hidden sm:rounded-3xl">
        <div className="flex max-h-[85vh]">
          <div className="w-5/12 bg-gradient-to-br from-muted/20 to-muted/10 flex flex-col p-4">
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-0.5">Market cap</p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-xl font-bold text-foreground">${marketCap || '0'}</h3>
                <span className={`text-xs font-semibold ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-[200px] relative px-4">
              <Carousel className="w-full h-full" opts={{ loop: false }} setApi={setCarouselApi}>
                <CarouselContent className="h-full">
                  <CarouselItem className="h-full">
                    <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/10 to-muted/5 rounded-lg overflow-hidden">
                      {displayImage ? (
                        <img src={displayImage} alt={coin.name} className="max-w-full max-h-full object-contain" />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Coins className="w-16 h-16 mb-2 opacity-30" />
                          <p className="text-sm">No media available</p>
                        </div>
                      )}
                    </div>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="left-0 bg-background/80 hover:bg-background" />
                <CarouselNext className="right-0 bg-background/80 hover:bg-background" />
              </Carousel>
            </div>
          </div>

          <div className="w-7/12 flex flex-col overflow-hidden">
            <DialogHeader className="px-4 pt-4 pb-2">
              <DialogTitle className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{coin.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">@{formatAddress(coin.creator_wallet)}</p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="trade" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent px-4 h-auto p-0">
                <TabsTrigger value="trade" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Trade</TabsTrigger>
                <TabsTrigger value="comments" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Comments</TabsTrigger>
                <TabsTrigger value="holders" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2">Holders</TabsTrigger>
              </TabsList>

              <TabsContent value="trade" className="flex-1 px-4 pb-4 mt-0 pt-3 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Market Cap</p>
                    <p className="text-sm font-bold text-green-500">${marketCap || '0'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">24H Volume</p>
                    <p className="text-sm font-semibold">{volume24h ? formatSmartCurrency(parseFloat(volume24h)) : 'Loading...'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Creator Earnings</p>
                    <p className="text-sm font-semibold">{creatorEarnings ? formatSmartCurrency(parseFloat(creatorEarnings)) : 'Loading...'}</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  <Button onClick={() => setIsBuying(true)} className={`flex-1 ${isBuying ? 'bg-green-500' : 'bg-transparent'}`} disabled={isTrading || !!txHash}>Buy</Button>
                  <Button onClick={() => setIsBuying(false)} className={`flex-1 ${!isBuying ? 'bg-red-500' : 'bg-transparent'}`} disabled={isTrading || !!txHash}>Sell</Button>
                </div>

                <Input type="number" value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} className="mb-2" disabled={isTrading || !!txHash} />

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {['0.001', '0.01', '0.1', 'Max'].map((label) => (
                    <Button key={label} variant="outline" size="sm" onClick={() => setQuickAmount(label)} disabled={isTrading || !!txHash}>{label}</Button>
                  ))}
                </div>

                <Button onClick={handleTrade} disabled={isTrading || !isConnected} className="w-full">
                  {isTrading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Trading...</> : `${isBuying ? 'Buy' : 'Sell'} ${coin.symbol}`}
                </Button>
              </TabsContent>

              <TabsContent value="comments" className="flex-1 px-4 pb-4 overflow-y-auto">
                <div className="flex gap-2 mb-3">
                  <Input placeholder="Add a comment..." value={standaloneComment} onChange={(e) => setStandaloneComment(e.target.value)} />
                  <Button onClick={handleStandaloneComment}>Post</Button>
                </div>
                <ScrollArea className="flex-1">
                  {comments.map((c) => (
                    <div key={c.id} className="p-2 mb-2 bg-muted/20 rounded-lg">
                      <p className="text-sm font-medium">{formatAddress(c.userAddress)}</p>
                      <p className="text-sm text-muted-foreground">{c.comment}</p>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="holders" className="flex-1 px-4 pb-4 overflow-y-auto">
                <ScrollArea className="flex-1">
                  {holders.map((holder, idx) => (
                    <div key={holder.address} className="flex justify-between p-2 border-b">
                      <span>#{idx + 1} {formatAddress(holder.address)}</span>
                      <span>{holder.percentage.toFixed(2)}%</span>
                    </div>
                  ))}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

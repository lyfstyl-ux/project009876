
import { useState, useEffect } from "react";
import type { Coin, Comment } from "@shared/schema";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { formatEther } from "viem";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getCoin } from "@zoralabs/coins-sdk";
import { base } from "viem/chains";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ExternalLink, MessageCircle, Coins } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatSmartCurrency } from "@/lib/utils";

interface MobileTradeModalProps {
  coin: Coin;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MobileTradeModal({ coin, open, onOpenChange }: MobileTradeModalProps) {
  const { toast } = useToast();
  const [ethAmount, setEthAmount] = useState("");
  const [isTrading, setIsTrading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(true);
  const [comment, setComment] = useState("");
  const [balance, setBalance] = useState<string>("0");
  const [marketCap, setMarketCap] = useState<string | null>(null);
  const [volume24h, setVolume24h] = useState<string | null>(null);

  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['/api/comments/coin', coin.address],
    enabled: open && !!coin.address,
  });

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
        if (coinData?.marketCap) setMarketCap(coinData.marketCap.toString());
        if (coinData?.volume24h) setVolume24h(coinData.volume24h.toString());
      } catch (error) {
        console.error("Error fetching coin stats:", error);
      }
    }
    if (open) fetchCoinStats();
  }, [coin.address, open]);

  const handleTrade = async () => {
    if (!isConnected || !address || !walletClient || !publicClient) {
      toast({ title: "Wallet not connected", variant: "destructive" });
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
        toast({ title: "Trade successful!" });
      }
    } catch (error) {
      toast({ title: "Trade failed", variant: "destructive" });
    } finally {
      setIsTrading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>{coin.name} ({coin.symbol})</DrawerTitle>
        </DrawerHeader>

        <Tabs defaultValue="trade" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-full">
            <TabsTrigger value="trade">Trade</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
          </TabsList>

          <TabsContent value="trade" className="px-4 pb-6">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <p className="text-xs text-muted-foreground">Market Cap</p>
                <p className="text-sm font-bold">${marketCap || '0'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">24H Volume</p>
                <p className="text-sm">{volume24h ? formatSmartCurrency(parseFloat(volume24h)) : '0'}</p>
              </div>
            </div>

            <div className="flex gap-2 mb-3">
              <Button onClick={() => setIsBuying(true)} className={isBuying ? 'bg-green-500' : ''}>Buy</Button>
              <Button onClick={() => setIsBuying(false)} className={!isBuying ? 'bg-red-500' : ''}>Sell</Button>
            </div>

            <Input type="number" value={ethAmount} onChange={(e) => setEthAmount(e.target.value)} className="mb-3" placeholder="0.0" />

            <Button onClick={handleTrade} disabled={isTrading || !isConnected} className="w-full">
              {isTrading ? <Loader2 className="w-4 h-4 animate-spin" /> : `${isBuying ? 'Buy' : 'Sell'} ${coin.symbol}`}
            </Button>

            {txHash && (
              <div className="mt-3 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-green-500 inline mr-2" />
                <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-sm">
                  View on BaseScan <ExternalLink className="w-3 h-3 inline" />
                </a>
              </div>
            )}
          </TabsContent>

          <TabsContent value="comments" className="px-4 pb-6">
            <ScrollArea className="h-64">
              {comments.map((c) => (
                <div key={c.id} className="p-2 mb-2 bg-muted/20 rounded">
                  <p className="text-sm">{c.comment}</p>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
}

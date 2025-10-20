
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadToIPFS } from "@/lib/pinata";
import { Calendar, User, ExternalLink, Loader2, Plus } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createWalletClient, custom } from "viem";
import { base } from "viem/chains";

interface ContentPreviewProps {
  scrapedData: any;
  onCoinCreated: () => void;
}

export default function ContentPreview({ scrapedData, onCoinCreated }: ContentPreviewProps) {
  const { toast } = useToast();
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  
  const walletAddress = user?.wallet?.address as `0x${string}` | undefined;
  const privyWallet = wallets[0];

  const generateSymbol = (title: string) => {
    const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    const words = cleanTitle.split(/\s+/).filter(word => word.length > 0);

    let symbol = '';
    if (words.length >= 2) {
      symbol = words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
    } else {
      symbol = cleanTitle.slice(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    return symbol || 'COIN';
  };

  const [coinSymbol, setCoinSymbol] = useState(() => generateSymbol(scrapedData.title));

  const createCoinMutation = useMutation({
    mutationFn: async () => {
      if (!walletAddress || !privyWallet) throw new Error("Wallet not connected");

      const provider = await privyWallet.getEthereumProvider();
      const walletClient = createWalletClient({
        account: walletAddress,
        chain: base,
        transport: custom(provider),
      });

      const metadata = {
        title: scrapedData.title,
        description: scrapedData.description,
        image: scrapedData.image,
        originalUrl: scrapedData.url,
        author: scrapedData.author,
        publishDate: scrapedData.publishDate,
        content: scrapedData.content,
      };

      const ipfsUri = await uploadToIPFS(metadata);

      const createdCoin = await apiRequest("POST", "/api/coins", {
        name: scrapedData.title,
        symbol: coinSymbol,
        creator_wallet: walletAddress,
        status: 'pending' as const,
        ipfsUri: ipfsUri,
        image: scrapedData.image || "",
        description: scrapedData.description || `A coin representing ${scrapedData.title}`,
      });

      const createdCoinJson = await createdCoin.json();

      const { deployCreatorCoinDirect } = await import('@/lib/zora-factory');
      const deployResult = await deployCreatorCoinDirect(
        {
          name: scrapedData.title,
          symbol: coinSymbol,
          metadataUri: ipfsUri,
          creatorAddress: walletAddress,
          contentUrl: scrapedData.url || ipfsUri,
          useActivityTracker: false,
        },
        walletClient,
        8453
      );

      await apiRequest("PATCH", `/api/coins/${createdCoinJson.id}`, {
        address: deployResult.address,
        chainId: (walletClient.chain?.id || 8453).toString(),
        status: 'active' as const,
        createdAt: deployResult.createdAt,
      });

      return { coin: { ...createdCoinJson, address: deployResult.address, status: 'active' } };
    },
    onSuccess: (data) => {
      toast({ title: "Coin Deployed Successfully! 🎉", description: `${data.coin.symbol} is now live` });
      queryClient.invalidateQueries({ queryKey: ["/api/coins"] });
      onCoinCreated();
    },
    onError: (error: Error) => {
      toast({ title: "Coin creation failed", description: error.message, variant: "destructive" });
    },
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-1">
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          {scrapedData.image && (
            <img src={scrapedData.image} alt={scrapedData.title} className="w-full h-32 object-cover rounded-lg" />
          )}
        </div>

        <div className="md:col-span-2 space-y-3">
          <div>
            <h3 className="text-lg font-bold">{scrapedData.title}</h3>
            {scrapedData.description && <p className="text-xs text-muted-foreground line-clamp-2">{scrapedData.description}</p>}
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {scrapedData.author && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{scrapedData.author}</span>
              </div>
            )}
            {scrapedData.publishDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(scrapedData.publishDate)}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t">
            <Label htmlFor="coinSymbol" className="block text-xs font-medium mb-1.5">Coin Symbol</Label>
            <div className="flex gap-2">
              <Input
                id="coinSymbol"
                type="text"
                value={coinSymbol}
                onChange={(e) => setCoinSymbol(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                className="flex-1 h-9"
                disabled={createCoinMutation.isPending}
              />
              <Button
                onClick={() => createCoinMutation.mutate()}
                disabled={createCoinMutation.isPending || !coinSymbol || !walletAddress}
                className="h-9"
              >
                {createCoinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />Create</>}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ContentPreviewCardProps {
  scrapedData: any;
  onCoinCreated?: () => void;
}

export default function ContentPreviewCard({ scrapedData, onCoinCreated }: ContentPreviewCardProps) {
  const [, setLocation] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  const [coinName, setCoinName] = useState(scrapedData.title || "");
  const [coinSymbol, setCoinSymbol] = useState("");
  const { toast } = useToast();

  const handleCreateCoin = async () => {
    if (!coinName.trim() || !coinSymbol.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both coin name and symbol",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      toast({
        title: "Coin created!",
        description: `${coinSymbol} is now live and tradeable`,
      });

      setTimeout(() => {
        if (onCoinCreated) {
          onCoinCreated();
        }
        setLocation("/");
      }, 1000);
    } catch (error) {
      console.error("Error creating coin:", error);
      toast({
        title: "Creation failed",
        description: "Failed to create coin. Please try again.",
        variant: "destructive",
      });
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {scrapedData.image && (
        <div className="aspect-video rounded-2xl overflow-hidden bg-muted">
          <img
            src={scrapedData.image}
            alt={scrapedData.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="preview-title" className="text-sm font-medium text-foreground">
            Title
          </Label>
          <p className="text-base font-semibold text-foreground">{scrapedData.title}</p>
        </div>

        {scrapedData.description && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Description</Label>
            <p className="text-sm text-muted-foreground line-clamp-3">{scrapedData.description}</p>
          </div>
        )}

        {scrapedData.author && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Creator</Label>
            <p className="text-sm text-foreground">{scrapedData.author}</p>
          </div>
        )}

        <div className="pt-4 border-t border-border/30 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coin-name" className="text-sm font-medium text-foreground">
              Coin Name <span className="text-red-500">*</span>
            </Label>
            <div className="bg-muted/30 dark:bg-muted/20 rounded-2xl p-1 border border-border/30">
              <Input
                id="coin-name"
                value={coinName}
                onChange={(e) => setCoinName(e.target.value)}
                placeholder="Enter coin name"
                className="bg-transparent border-0 h-11 px-4 focus-visible:ring-0 focus-visible:ring-offset-0"
                data-testid="input-coin-name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coin-symbol" className="text-sm font-medium text-foreground">
              Coin Symbol <span className="text-red-500">*</span>
            </Label>
            <div className="bg-muted/30 dark:bg-muted/20 rounded-2xl p-1 border border-border/30">
              <Input
                id="coin-symbol"
                value={coinSymbol}
                onChange={(e) => setCoinSymbol(e.target.value.toUpperCase())}
                placeholder="e.g., MUSIC"
                maxLength={10}
                className="bg-transparent border-0 h-11 px-4 focus-visible:ring-0 focus-visible:ring-offset-0 uppercase"
                data-testid="input-coin-symbol"
              />
            </div>
          </div>
        </div>

        <Button
          onClick={handleCreateCoin}
          disabled={isCreating || !coinName.trim() || !coinSymbol.trim()}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary hover:from-primary/100 hover:to-primary/90 text-primary-foreground font-semibold rounded-2xl transition-all mt-6"
          data-testid="button-create-coin"
        >
          {isCreating ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creating Coin...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Create Coin
            </>
          )}
        </Button>
      </div>
    </div>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Coins, Users, TrendingUp, Shield, Zap } from "lucide-react";

export default function Docs() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Documentation</h1>
      </div>

      <p className="text-lg text-muted-foreground">
        Everything you need to know about using our platform to discover, trade, and engage with creator coins.
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <CardTitle>What are Creator Coins?</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Creator coins are digital tokens that represent support for your favorite creators. When you buy a creator's coin, you're investing in their success and joining their community.
            </p>
            <p>
              Each coin's value can go up or down based on the creator's popularity and community engagement. Early supporters can benefit as creators grow their following.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>How to Trade Coins</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p><strong>Step 1:</strong> Browse trending coins on the home page or explore all coins in the Coins section.</p>
            <p><strong>Step 2:</strong> Click on any coin card to open the trading modal.</p>
            <p><strong>Step 3:</strong> Choose to Buy or Sell, enter the amount, and confirm your transaction.</p>
            <p><strong>Step 4:</strong> Your coins will appear in your portfolio, and you can track their performance over time.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle>Discovering Creators</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              Explore trending creators across different categories like Music, Art, Gaming, and more. Use the category filters to find creators in your areas of interest.
            </p>
            <p>
              Check out creator profiles to see their bio, social links, and coin performance. Connect with creators you support and track their journey.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>Safety & Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p>
              All transactions are secured on the blockchain, ensuring transparency and immutability. Your wallet is protected by industry-standard encryption.
            </p>
            <p>
              We integrate with Zora, a trusted platform for creator economies, to ensure coin authenticity and fair trading practices.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Getting Started</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-muted-foreground">
            <p><strong>1. Connect Your Wallet:</strong> Click the "Login" button and connect your crypto wallet (MetaMask, Coinbase Wallet, etc.).</p>
            <p><strong>2. Browse Coins:</strong> Explore trending coins from Zora and other creators on the platform.</p>
            <p><strong>3. Make Your First Trade:</strong> Start with a small amount to get comfortable with the trading interface.</p>
            <p><strong>4. Join the Community:</strong> Follow creators, engage with their content, and watch your portfolio grow.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

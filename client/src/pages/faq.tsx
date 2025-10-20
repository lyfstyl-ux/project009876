
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export default function FAQ() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3">
        <HelpCircle className="h-8 w-8 text-primary" />
        <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
      </div>

      <p className="text-lg text-muted-foreground">
        Find answers to common questions about using our platform.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>General Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is this platform?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We're a platform where you can discover and trade creator coins. Support your favorite creators by buying their coins, and benefit as they grow their community and popularity.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>Do I need cryptocurrency to use this platform?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, you'll need a crypto wallet with some cryptocurrency (like ETH) to trade coins. We support popular wallets like MetaMask and Coinbase Wallet.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>Is this platform free to use?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Browsing and exploring is completely free. When you trade coins, you'll pay standard blockchain transaction fees (gas fees) which go to the network, not to us.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>How do I connect my wallet?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Click the "Login" button in the top navigation. You'll be prompted to connect your wallet. Choose your wallet provider and follow the prompts to authorize the connection.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trading & Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-5">
              <AccordionTrigger>How do coin prices work?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Coin prices are determined by market activity - supply and demand. As more people buy a creator's coin, the price typically increases. When people sell, the price may decrease.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>Can I sell my coins anytime?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! You can sell your coins at any time. The selling price will be based on the current market value of the coin.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>What is market cap?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Market cap is the total value of all coins in circulation. It's calculated by multiplying the coin price by the total number of coins. Higher market cap usually means more established coins.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>What does volume mean?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Volume shows how much trading activity a coin has had in the last 24 hours. Higher volume means more active trading and usually indicates strong interest in that creator.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Creators</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-9">
              <AccordionTrigger>How do I become a creator on this platform?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Connect your wallet and visit your profile to set up your creator account. You can create your own coin and share it with your community to start building support.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-10">
              <AccordionTrigger>Do creators earn when people trade their coins?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! Creators earn a percentage of trading fees when people buy and sell their coins. This creates a sustainable way for creators to earn from their community's growth.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-11">
              <AccordionTrigger>Where do the Zora coins come from?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                We integrate with Zora, a leading platform for creator economies, to show trending creator coins. These are real coins created by verified creators on the Zora network.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety & Support</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-12">
              <AccordionTrigger>Is my wallet safe?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes! We never have access to your private keys or funds. All transactions are executed directly through your wallet with your explicit approval. Always keep your wallet's recovery phrase secure and never share it with anyone.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-13">
              <AccordionTrigger>What if I have a problem or question?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                You can reach out through our community channels or contact support. We're here to help with any issues or questions you might have.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-14">
              <AccordionTrigger>Are there risks to trading creator coins?</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Yes, like any investment, trading creator coins carries risk. Prices can go up or down. Only invest what you can afford to lose, and do your research before buying any coin.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

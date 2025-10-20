
import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useLocation } from "wouter";

interface ProductTourProps {
  onComplete?: () => void;
}

export function ProductTour({ onComplete }: ProductTourProps) {
  const [location] = useLocation();
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenProductTour");
    if (!hasSeenTour && location === "/") {
      // Delay to ensure DOM elements are mounted
      setTimeout(() => setRun(true), 500);
    }
  }, [location]);

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Welcome Aboard! 🎉</h2>
          <p className="text-muted-foreground">
            This tour will guide you through the key features and functionalities 
            that we offer, ensuring you have a smooth and successful start.
          </p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: "[data-testid='button-category-all']",
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Filter by Category</h3>
          <p className="text-sm text-muted-foreground">
            Browse creators and coins by category. Click on any category to filter the content.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-testid='button-view-all-coins']",
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Trending Coins</h3>
          <p className="text-sm text-muted-foreground">
            Click on any coin to view details and start trading. Support your favorite creators by buying their coins!
          </p>
        </div>
      ),
      placement: "left",
    },
    {
      target: "[data-testid='button-view-all-creators']",
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Discover Top Creators</h3>
          <p className="text-sm text-muted-foreground">
            Browse through trending creators and follow your favorites to stay updated with their latest content and coins.
          </p>
        </div>
      ),
      placement: "left",
    },
    {
      target: "[data-testid='nav-create']",
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Create Your Own Coin</h3>
          <p className="text-sm text-muted-foreground">
            Launch your creator coin and start earning from your community. It's easy and takes just a few minutes!
          </p>
        </div>
      ),
      placement: "right",
    },
    {
      target: "[data-testid='header-search']",
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Search Everything</h3>
          <p className="text-sm text-muted-foreground">
            Find creators, coins, and projects quickly using the search bar.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: "[data-testid='button-login']",
      content: (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Your Profile</h3>
          <p className="text-sm text-muted-foreground">
            Login to access your profile, view your coins, check your E1XP points, and manage your account settings.
          </p>
        </div>
      ),
      placement: "bottom-end",
    },
  ];

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, index, action } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      localStorage.setItem("hasSeenProductTour", "true");
      onComplete?.();
    }

    if (action === "next" || action === "prev") {
      setStepIndex(index + (action === "next" ? 1 : -1));
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      scrollOffset={100}
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
          arrowColor: "hsl(var(--background))",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "12px",
          padding: "20px",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          borderRadius: "8px",
          padding: "8px 16px",
          fontSize: "14px",
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          marginRight: "8px",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Snooze",
      }}
    />
  );
}

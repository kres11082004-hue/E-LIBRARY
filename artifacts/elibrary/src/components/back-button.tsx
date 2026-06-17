import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface BackButtonProps {
  className?: string;
  fallback?: string;
}

export function BackButton({ className = "", fallback }: BackButtonProps) {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else if (fallback) {
      setLocation(fallback);
    } else {
      setLocation("/");
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={`gap-2 text-muted-foreground hover:text-foreground shrink-0 self-start -ml-2 mb-4 ${className}`}
      onClick={handleBack}
    >
      <ArrowLeft className="w-4 h-4" />
      Back
    </Button>
  );
}

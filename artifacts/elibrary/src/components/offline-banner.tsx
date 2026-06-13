import { useOnlineStatus } from "@/hooks/use-online-status";
import { WifiOff, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * OfflineBanner
 * Shows a sticky banner at the top of the page when the user is offline.
 * Briefly shows a "back online" confirmation when connectivity is restored.
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [showRestored, setShowRestored] = useState(false);
  const [prevOnline, setPrevOnline] = useState(isOnline);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Went from offline → online
    if (!prevOnline && isOnline) {
      setShowRestored(true);
      timer = setTimeout(() => setShowRestored(false), 3000);
      setPrevOnline(true);
    }

    // Went from online → offline
    if (prevOnline && !isOnline) {
      setPrevOnline(false);
      setShowRestored(false);
    }

    return () => {
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [isOnline, prevOnline]);

  if (isOnline && !showRestored) return null;

  if (showRestored) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white animate-in slide-in-from-top duration-300"
        style={{ background: "linear-gradient(90deg, #16a34a, #15803d)" }}
        role="status"
        aria-live="polite"
      >
        <Wifi className="w-4 h-4 shrink-0" />
        <span>You&apos;re back online! Content is up to date.</span>
      </div>
    );
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white animate-in slide-in-from-top duration-300"
      style={{ background: "linear-gradient(90deg, #b45309, #92400e)" }}
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
      <span>
        You&apos;re offline — browsing cached content. Some features may be
        unavailable.
      </span>
    </div>
  );
}

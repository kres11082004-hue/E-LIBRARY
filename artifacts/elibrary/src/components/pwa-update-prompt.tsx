import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";
import { useState } from "react";

/**
 * PwaUpdatePrompt
 * Shows a toast-style prompt when a new version of the app is available.
 * The user can click "Update" to reload and apply it, or dismiss.
 */
export function PwaUpdatePrompt() {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("[PWA] Service Worker registered:", r);
    },
    onRegisterError(error) {
      console.warn("[PWA] Service Worker registration failed:", error);
    },
  });

  if (!needRefresh || dismissed) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium text-white animate-in slide-in-from-bottom duration-300"
      style={{
        background: "linear-gradient(135deg, #0f1f3d, #1e3a5f)",
        border: "1px solid rgba(255,255,255,0.12)",
        minWidth: "320px",
        maxWidth: "90vw",
      }}
      role="alert"
    >
      <RefreshCw className="w-4 h-4 shrink-0 text-amber-400" />
      <span className="flex-1 text-white/90">
        A new version is available!
      </span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-amber-500 hover:bg-amber-400 transition-colors"
      >
        Update
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded-md hover:bg-white/10 transition-colors text-white/60 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

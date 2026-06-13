import { useRoute, Link, useLocation } from "wouter";
import { useGetBook, useAddToMyList, useGetMyList, getGetMyListQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, BookMarked, Sun, Moon, Type, Download, Wifi, WifiOff,
  ChevronLeft, ChevronRight, AlignLeft, Maximize2, Minimize2
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { triggerBookDownload } from "@/lib/download-helper";

// ─── Offline cache helpers ────────────────────────────────────────────────────
function cacheBook(id: number, data: unknown) {
  try { localStorage.setItem(`book_cache_${id}`, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota */ }
}
function getCachedBook(id: number): unknown | null {
  try {
    const raw = localStorage.getItem(`book_cache_${id}`);
    return raw ? JSON.parse(raw).data : null;
  } catch { return null; }
}
function saveProgress(id: number, pos: number) {
  try { localStorage.setItem(`reading_pos_${id}`, String(pos)); } catch { /* quota */ }
}
function getProgress(id: number): number {
  return parseInt(localStorage.getItem(`reading_pos_${id}`) || "0", 10) || 0;
}

// ─── Theme configs ────────────────────────────────────────────────────────────
const THEMES = {
  white:  { bg: "bg-white", text: "text-gray-900", bar: "bg-gray-200", page: "bg-gray-50" },
  sepia:  { bg: "bg-amber-50", text: "text-amber-900", bar: "bg-amber-200", page: "bg-amber-100/60" },
  dark:   { bg: "bg-gray-950", text: "text-gray-100", bar: "bg-gray-800", page: "bg-gray-900" },
};
type ThemeKey = keyof typeof THEMES;

const FONT_SIZES = ["text-base", "text-lg", "text-xl"] as const;
const FONT_LABELS = ["A−", "A", "A+"] as const;
const LINE_HEIGHTS = ["leading-relaxed", "leading-loose"] as const;

// ─── Paragraph renderer ───────────────────────────────────────────────────────
function renderContent(content: string, fontSize: string, lineHeight: string, textColor: string) {
  const paragraphs = content.split(/\n{2,}/).filter(Boolean);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (trimmed.startsWith("## ")) {
      return <h2 key={i} className={`font-serif font-bold text-2xl mt-8 mb-3 ${textColor}`}>{trimmed.slice(3)}</h2>;
    }
    if (trimmed.startsWith("# ")) {
      return <h1 key={i} className={`font-serif font-bold text-3xl mt-10 mb-4 ${textColor}`}>{trimmed.slice(2)}</h1>;
    }
    if (trimmed.startsWith("---")) {
      return <hr key={i} className="my-8 opacity-20" />;
    }
    return (
      <p key={i} className={`${fontSize} ${lineHeight} ${textColor} indent-8 mb-0`}>
        {trimmed}
      </p>
    );
  });
}

export default function ReadPage() {
  const [, params] = useRoute("/books/:id/read");
  const id = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const contentRef = useRef<HTMLDivElement>(null);

  // Reader settings
  const [theme, setTheme] = useState<ThemeKey>(() => (localStorage.getItem("reader_theme") as ThemeKey) || "white");
  const [fontIdx, setFontIdx] = useState(() => parseInt(localStorage.getItem("reader_font") || "0", 10));
  const [lineHeight, setLineHeight] = useState<0 | 1>(() => parseInt(localStorage.getItem("reader_lh") || "0", 10) as 0 | 1);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fullscreen, setFullscreen] = useState(false);
  const [cachedBook, setCachedBook] = useState<any>(null);

  // Track online/offline
  useEffect(() => {
    const on = () => setIsOffline(false);
    const off = () => setIsOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // Load cached version immediately for offline
  useEffect(() => {
    const c = getCachedBook(id);
    if (c) setCachedBook(c);
  }, [id]);

  // Persist settings
  useEffect(() => { localStorage.setItem("reader_theme", theme); }, [theme]);
  useEffect(() => { localStorage.setItem("reader_font", String(fontIdx)); }, [fontIdx]);
  useEffect(() => { localStorage.setItem("reader_lh", String(lineHeight)); }, [lineHeight]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: book, isLoading } = useGetBook(id, { query: { enabled: !!id && !isOffline } as any });

  // Cache book when loaded
  useEffect(() => {
    if (book) { cacheBook(id, book); setCachedBook(book); }
  }, [book, id]);

  const displayBook = book || cachedBook;

  // Reading list
  const { data: myList = [] } = useGetMyList();
  const addMutation = useAddToMyList();
  const inMyList = myList.some(item => item.bookId === id);

  // Restore scroll position
  useEffect(() => {
    if (!displayBook || !contentRef.current) return;
    const saved = getProgress(id);
    if (saved > 0) {
      setTimeout(() => {
        contentRef.current?.scrollTo({ top: saved });
      }, 100);
    }
  }, [displayBook, id]);

  // Track scroll progress
  const handleScroll = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const scrollable = el.scrollHeight - el.clientHeight;
    const pct = scrollable > 0 ? Math.round((el.scrollTop / scrollable) * 100) : 0;
    setProgress(pct);
    saveProgress(id, el.scrollTop);
  }, [id]);

  const handleToggleList = async () => {
    try {
      await addMutation.mutateAsync({ data: { bookId: id } });
      queryClient.invalidateQueries({ queryKey: getGetMyListQueryKey() });
      toast({ title: "Saved to your reading list" });
    } catch {
      toast({ title: "Already in your list", variant: "destructive" });
    }
  };

  const handleDownload = () => {
    if (!displayBook) return;
    triggerBookDownload(displayBook);
    toast({ title: "Download started" });
  };

  const t = THEMES[theme];

  if (isLoading && !cachedBook) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${t.bg}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!displayBook) {
    return (
      <div className="p-6 text-center py-20">
        <h2 className="font-semibold text-foreground">Book not found</h2>
        <Link href="/books"><Button variant="outline" className="mt-4">Back to Library</Button></Link>
      </div>
    );
  }

  const finalContent = displayBook.content || (
    `# ${displayBook.title}\n` +
    `## Introduction\n${displayBook.description || "No description available."}\n\n` +
    `## Chapter 1: The Digital Core\n` +
    `Welcome to the digital edition of "${displayBook.title}" by author ${displayBook.author}. ` +
    `This campus library book covers important topics inside the ${displayBook.category || "General"} field of studies. ` +
    `It has been optimized for online and offline access under the ZDSPGC E-Library system.\n\n` +
    `Students are encouraged to save this book to their personal reading list for quick bookmarks, offline reading caches, and tracking their academic progress.\n\n` +
    `## Chapter 2: Campus and Borrowing Services\n` +
    `If a physical print of this resource is needed, users can reserve a copy at the ${displayBook.campus} campus library. ` +
    `Simply check copy availability on the details screen and submit your request. ` +
    `Ensure you monitor your checkout schedules, return deadlines, and library notifications via the Borrowed Books system to avoid any account holds.\n\n` +
    `## Chapter 3: Key Takeaways\n` +
    `This digital content is cached locally on your device for offline browsing support. ` +
    `Even without internet access, you can read this material at any time. Enjoy your reading and research!`
  );

  const hasContent = true;

  return (
    <div className={`flex flex-col ${fullscreen ? "fixed inset-0 z-50" : "h-full min-h-screen"} ${t.bg} transition-colors duration-300`}>

      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 z-50">
        <div className="h-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>

      {/* Top bar */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 border-b transition-opacity ${t.bg} ${theme === "dark" ? "border-gray-800" : "border-gray-200"} ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"} sticky top-1 z-40`}
        style={{ transition: "opacity 0.2s" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setLocation(`/books/${id}`)}
            className={`flex items-center gap-1.5 text-sm font-medium shrink-0 ${t.text} opacity-70 hover:opacity-100 transition-opacity`}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="hidden sm:block h-4 w-px bg-current opacity-20" />
          <div className="min-w-0 hidden sm:block">
            <p className={`text-sm font-semibold truncate ${t.text}`}>{displayBook.title}</p>
            <p className={`text-xs truncate ${t.text} opacity-60`}>{displayBook.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Offline indicator */}
          {isOffline && (
            <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full mr-1 ${theme === "dark" ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-700"}`}>
              <WifiOff className="w-3 h-3" /> Offline
            </span>
          )}
          {/* Font size */}
          <button
            onClick={() => setFontIdx(i => (i + 1) % 3)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${t.text} opacity-70 hover:opacity-100 hover:bg-black/5 transition-all`}
            title="Font size"
          >
            {FONT_LABELS[fontIdx]}
          </button>
          {/* Line height */}
          <button
            onClick={() => setLineHeight(h => h === 0 ? 1 : 0)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.text} opacity-70 hover:opacity-100 hover:bg-black/5 transition-all`}
            title="Line spacing"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          {/* Theme */}
          <button
            onClick={() => setTheme(th => th === "white" ? "sepia" : th === "sepia" ? "dark" : "white")}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.text} opacity-70 hover:opacity-100 hover:bg-black/5 transition-all`}
            title="Reading theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {/* Download */}
          <button
            onClick={handleDownload}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.text} opacity-70 hover:opacity-100 hover:bg-black/5 transition-all`}
            title="Download as text"
          >
            <Download className="w-4 h-4" />
          </button>
          {/* Save to list */}
          {!inMyList && (
            <button
              onClick={handleToggleList}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.text} opacity-70 hover:opacity-100 hover:bg-black/5 transition-all`}
              title="Save to reading list"
            >
              <BookMarked className="w-4 h-4" />
            </button>
          )}
          {/* Fullscreen */}
          <button
            onClick={() => setFullscreen(f => !f)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.text} opacity-70 hover:opacity-100 hover:bg-black/5 transition-all`}
            title="Fullscreen"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main reading area */}
      <div
        ref={contentRef}
        onScroll={handleScroll}
        onClick={() => setShowControls(c => !c)}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="max-w-2xl mx-auto px-6 py-10 pb-24">
          {/* Book header */}
          <div className="text-center mb-12">
            {displayBook.coverUrl && (
              <img
                src={displayBook.coverUrl}
                alt={displayBook.title}
                className="w-32 h-44 object-cover rounded-xl shadow-lg mx-auto mb-8"
              />
            )}
            <h1 className={`font-serif font-bold text-3xl md:text-4xl leading-tight mb-3 ${t.text}`}>
              {displayBook.title}
            </h1>
            <p className={`text-lg ${t.text} opacity-60 mb-1`}>{displayBook.author}</p>
            {displayBook.publishedYear && (
              <p className={`text-sm ${t.text} opacity-40`}>{displayBook.publishedYear}</p>
            )}
            <div className={`mt-6 w-16 h-0.5 mx-auto ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"}`} />
          </div>

          {/* Content */}
          {hasContent ? (
            <div className="space-y-6">
              {renderContent(finalContent, FONT_SIZES[fontIdx], LINE_HEIGHTS[lineHeight], t.text)}
            </div>
          ) : (
            /* No content — show description + placeholder */
            <div className="space-y-8">
              <div className={`rounded-2xl p-6 ${t.page}`}>
                <p className={`text-sm font-semibold uppercase tracking-widest mb-3 ${t.text} opacity-40`}>About this book</p>
                <p className={`${FONT_SIZES[fontIdx]} ${LINE_HEIGHTS[lineHeight]} ${t.text} opacity-80 leading-relaxed`}>
                  {displayBook.description}
                </p>
              </div>
              <div className={`rounded-2xl border-2 border-dashed p-8 text-center ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
                <Type className={`w-8 h-8 mx-auto mb-3 ${t.text} opacity-30`} />
                <p className={`font-semibold mb-1 ${t.text} opacity-60`}>Full text not yet available</p>
                <p className={`text-sm ${t.text} opacity-40 mb-4`}>
                  An admin or librarian can add the full book content.
                </p>
                {displayBook.isAvailablePhysical && (
                  <p className={`text-sm ${t.text} opacity-50`}>
                    Physical copy available at <strong>{displayBook.campus}</strong> library ({displayBook.availableCopies ?? 0} copies).
                  </p>
                )}
              </div>
            </div>
          )}

          {/* End of book */}
          {hasContent && (
            <div className={`mt-16 pt-8 border-t text-center ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`}>
              <div className={`text-2xl mb-3`}>✦</div>
              <p className={`font-serif text-lg italic ${t.text} opacity-50`}>End of book</p>
              <p className={`text-sm ${t.text} opacity-30 mt-1`}>{displayBook.title} · {displayBook.author}</p>
              <div className="flex justify-center gap-3 mt-6">
                <Button variant="outline" onClick={() => setLocation("/books")} className={theme === "dark" ? "border-gray-700 text-gray-300 hover:bg-gray-800" : ""}>
                  Browse More Books
                </Button>
                <Button onClick={handleDownload} className="gap-2">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom progress bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 py-2 px-6 flex items-center gap-3 transition-opacity ${t.bg} ${theme === "dark" ? "border-gray-800" : "border-gray-100"} border-t ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ transition: "opacity 0.2s" }}
      >
        <span className={`text-xs ${t.text} opacity-40 shrink-0`}>0%</span>
        <div className={`flex-1 h-1.5 rounded-full ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"}`}>
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className={`text-xs ${t.text} opacity-40 shrink-0`}>{progress}%</span>
      </div>
    </div>
  );
}

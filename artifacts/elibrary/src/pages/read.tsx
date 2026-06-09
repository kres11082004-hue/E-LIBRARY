import { useRoute, Link } from "wouter";
import { useGetBook, useAddToMyList, useGetMyList, getGetMyListQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookMarked, BookmarkX, ExternalLink, BookOpen, Maximize2, Minimize2 } from "lucide-react";
import { useState } from "react";

export default function ReadPage() {
  const [, params] = useRoute("/books/:id/read");
  const id = parseInt(params?.id || "0");
  const [fullscreen, setFullscreen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: book, isLoading } = useGetBook(id, { query: { enabled: !!id } as any });
  const { data: myList = [] } = useGetMyList();
  const addMutation = useAddToMyList();
  const inMyList = myList.some(item => item.bookId === id);

  const handleToggleList = async () => {
    try {
      await addMutation.mutateAsync({ data: { bookId: id } });
      queryClient.invalidateQueries({ queryKey: getGetMyListQueryKey() });
      toast({ title: "Saved to your reading list" });
    } catch {
      toast({ title: "Already in your list", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading book...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-6 text-center py-20">
        <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-semibold text-foreground">Book not found</h2>
        <Link href="/books"><Button variant="outline" className="mt-4">Back to Library</Button></Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${fullscreen ? "fixed inset-0 z-50 bg-background" : "h-full"}`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/books/${book.id}`}>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-semibold text-foreground truncate">{book.title}</p>
            <p className="text-xs text-muted-foreground truncate">{book.author}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!inMyList && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={handleToggleList} disabled={addMutation.isPending}>
              <BookMarked className="w-3 h-3" /> Save
            </Button>
          )}
          {book.fileUrl && (
            <a href={book.fileUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs">
                <ExternalLink className="w-3 h-3" /> Open in tab
              </Button>
            </a>
          )}
          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setFullscreen(f => !f)} title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Reader Area */}
      <div className="flex-1 overflow-hidden">
        {book.fileUrl ? (
          <iframe
            src={book.fileUrl}
            title={book.title}
            className="w-full h-full border-0"
            style={{ minHeight: fullscreen ? "calc(100vh - 48px)" : "calc(100vh - 180px)" }}
            allow="fullscreen"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-center px-6 py-12">
            <div className="w-24 h-32 bg-muted rounded-lg flex items-center justify-center mb-6 shadow-sm">
              {book.coverUrl ? (
                <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <BookOpen className="w-10 h-10 text-muted-foreground/40" />
              )}
            </div>
            <h2 className="text-xl font-bold text-foreground mb-1">{book.title}</h2>
            <p className="text-muted-foreground mb-6">{book.author}</p>

            <div className="max-w-md bg-muted/50 rounded-xl p-5 text-left mb-6">
              <p className="text-sm font-semibold text-foreground mb-2">About this book</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-sm text-center">
              <BookOpen className="w-6 h-6 text-amber-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-amber-800">No digital copy available</p>
              <p className="text-xs text-amber-700 mt-1">
                {book.isAvailablePhysical
                  ? `Visit the ${book.campus} library to borrow a physical copy (${book.availableCopies ?? 0} available).`
                  : "Contact the library to request a digital copy of this book."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

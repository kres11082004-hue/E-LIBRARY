import { Link } from "wouter";
import { useGetMyList, useRemoveFromMyList, getGetMyListQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, BookMarked, Trash2, Globe, ExternalLink } from "lucide-react";

export default function MyListPage() {
  const { data: myList = [], isLoading } = useGetMyList();
  const removeMutation = useRemoveFromMyList();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleRemove = async (bookId: number, title: string) => {
    try {
      await removeMutation.mutateAsync({ bookId });
      queryClient.invalidateQueries({ queryKey: getGetMyListQueryKey() });
      toast({ title: `"${title}" removed from your list` });
    } catch {
      toast({ title: "Error removing book", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 flex gap-4 animate-pulse">
            <div className="w-14 h-20 bg-muted rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Reading List</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{myList.length} saved {myList.length === 1 ? "book" : "books"}</p>
      </div>

      {myList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookMarked className="w-14 h-14 text-muted-foreground/30 mb-4" />
          <h2 className="font-semibold text-foreground">Your reading list is empty</h2>
          <p className="text-muted-foreground text-sm mt-1">Browse the library and save books you want to read.</p>
          <Link href="/books"><Button className="mt-6" variant="outline">Browse Library</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {myList.map((item) => (
            <div key={item.id} className="bg-card border rounded-xl p-4 flex gap-4 hover:shadow-sm transition-shadow">
              {/* Cover */}
              <Link href={`/books/${item.bookId}`}>
                <div className="w-14 h-20 bg-muted rounded-lg overflow-hidden shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                  {item.book.coverUrl ? (
                    <img src={item.book.coverUrl} alt={item.book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link href={`/books/${item.bookId}`}>
                  <h3 className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer line-clamp-2">{item.book.title}</h3>
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">{item.book.author}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{item.book.category}</span>
                  <span className="text-xs text-muted-foreground">{item.book.campus}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Saved on {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 shrink-0">
                {item.book.fileUrl && (
                  <a href={item.book.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs">
                      <Globe className="w-3 h-3" /> Read
                    </Button>
                  </a>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(item.bookId, item.book.title)}
                  disabled={removeMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Offline hint */}
      {myList.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
          <p className="text-sm text-foreground font-medium">Offline Access</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your saved books are stored locally. Book metadata will be available even when offline.
            Click "Read" to open books with a working internet connection.
          </p>
        </div>
      )}
    </div>
  );
}

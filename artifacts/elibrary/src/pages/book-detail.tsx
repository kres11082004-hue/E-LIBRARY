import { useRoute, Link } from "wouter";
import { useGetBook, useAddToMyList, useRemoveFromMyList, useGetMyList, getGetMyListQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ArrowLeft, BookMarked, BookmarkX, Download, Calendar, Hash, Building, Globe } from "lucide-react";

export default function BookDetailPage() {
  const [, params] = useRoute("/books/:id");
  const id = parseInt(params?.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: book, isLoading } = useGetBook(id, { query: { enabled: !!id } as any });
  const { data: myList = [] } = useGetMyList();
  const addMutation = useAddToMyList();
  const removeMutation = useRemoveFromMyList();

  const inMyList = myList.some(item => item.bookId === id);

  const handleToggleList = async () => {
    try {
      if (inMyList) {
        await removeMutation.mutateAsync({ bookId: id });
        toast({ title: "Removed from your list" });
      } else {
        await addMutation.mutateAsync({ data: { bookId: id } });
        toast({ title: "Saved to your reading list" });
      }
      queryClient.invalidateQueries({ queryKey: getGetMyListQueryKey() });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-6 bg-muted rounded w-32" />
        <div className="flex gap-8">
          <div className="w-48 h-64 bg-muted rounded-xl shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
          </div>
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/books">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </button>
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover */}
        <div className="shrink-0">
          <div className="w-full md:w-48 h-64 bg-muted rounded-xl overflow-hidden shadow-md">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <BookOpen className="w-10 h-10 opacity-30" />
                <span className="text-xs text-center px-4">{book.category}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              onClick={handleToggleList}
              variant={inMyList ? "secondary" : "default"}
              className="w-full gap-2"
              disabled={addMutation.isPending || removeMutation.isPending}
            >
              {inMyList ? <><BookmarkX className="w-4 h-4" /> Remove from List</> : <><BookMarked className="w-4 h-4" /> Save to My List</>}
            </Button>
            {book.fileUrl && (
              <a href={book.fileUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full gap-2">
                  <Globe className="w-4 h-4" /> Read Online
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          <div>
            <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{book.category}</span>
            <h1 className="text-2xl font-bold text-foreground mt-3 leading-tight">{book.title}</h1>
            <p className="text-lg text-muted-foreground mt-1">{book.author}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {book.publishedYear && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{book.publishedYear}</span>
              </div>
            )}
            {book.isbn && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="w-4 h-4" />
                <span className="font-mono text-xs">{book.isbn}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="w-4 h-4" />
              <span>{book.campus}</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
          </div>

          {/* Physical Availability */}
          {book.isAvailablePhysical && (
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold text-sm text-foreground mb-3">Physical Copy Availability</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{book.availableCopies ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="text-muted-foreground">/</div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{book.totalCopies ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Copies</p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.round(((book.availableCopies ?? 0) / Math.max(book.totalCopies ?? 1, 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(book.availableCopies ?? 0) > 0 ? "Available for borrowing" : "All copies are borrowed"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Visit {book.campus} library to borrow a physical copy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

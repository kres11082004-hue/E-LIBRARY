import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListBooks, useAddToMyList, useGetMyList, getGetMyListQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Search, BookOpen, BookMarked, Filter, BookText, Download, Plus } from "lucide-react";
import { triggerBookDownload } from "@/lib/download-helper";
import { BackButton } from "@/components/back-button";

const CATEGORIES = ["All", "Fiction", "Non-Fiction", "Science", "Technology", "History", "Philosophy", "Mathematics", "Literature", "Reference", "Thesis"];

function BookCard({ book, inMyList, onAdd }: { book: any; inMyList: boolean; onAdd: (e: React.MouseEvent) => void }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return (
    <div
      className="bg-card border rounded-xl p-4 flex gap-4 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => setLocation(`/books/${book.id}`)}
    >
      <div className="w-20 h-28 bg-muted rounded-lg flex items-center justify-center overflow-hidden relative shrink-0 group-hover:opacity-90 transition-opacity">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="w-8 h-8 text-muted-foreground/50" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">{book.title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{book.author}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{book.category}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{book.campus}</span>
          {book.isAvailablePhysical && (
            <span className="text-xs text-green-600 font-medium ml-2">
              • {book.availableCopies}/{book.totalCopies} available
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 shrink-0 justify-between items-end">
        {book.fileUrl ? (
          <Button size="sm" className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white" onClick={(e) => { e.stopPropagation(); triggerBookDownload(book); toast({ title: `"${book.title}" download started` }); }}>
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
        ) : (
          <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={(e) => { e.stopPropagation(); setLocation(`/books/${book.id}/read`); }}>
            <BookText className="w-3.5 h-3.5" /> Read
          </Button>
        )}

        <Button
          size="sm"
          variant={inMyList ? "secondary" : "outline"}
          className="h-8 text-xs gap-1.5"
          onClick={(e) => { e.stopPropagation(); onAdd(e); }}
          disabled={inMyList}
        >
          <BookMarked className="w-3.5 h-3.5" />
          {inMyList ? "Saved" : "Save"}
        </Button>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: books = [], isLoading } = useListBooks({
    search: search || undefined,
    category: category !== "All" ? category : undefined,
  });
  const { data: myList = [] } = useGetMyList();
  const addMutation = useAddToMyList();

  const myListIds = new Set(myList.map(item => item.bookId));

  const handleAdd = async (bookId: number, title: string) => {
    try {
      await addMutation.mutateAsync({ data: { bookId } });
      queryClient.invalidateQueries({ queryKey: getGetMyListQueryKey() });
      toast({ title: `"${title}" saved to your list` });
    } catch {
      toast({ title: "Already in your list or error occurred", variant: "destructive" });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Browse Library</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{books.length} books available — click any book to read</p>
        </div>
        {(user?.role === "admin" || user?.role === "librarian") && (
          <Button onClick={() => setLocation("/admin/books")} className="gap-2">
            <Plus className="w-4 h-4" /> Add Book
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by title, author, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl p-4 flex gap-4 animate-pulse">
              <div className="w-20 h-28 bg-muted rounded-lg shrink-0" />
              <div className="flex-1 py-2 space-y-3">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="w-14 h-14 text-muted-foreground/30 mb-4" />
          <h2 className="font-semibold text-foreground">No books found</h2>
          <p className="text-muted-foreground text-sm mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              inMyList={myListIds.has(book.id)}
              onAdd={() => handleAdd(book.id, book.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

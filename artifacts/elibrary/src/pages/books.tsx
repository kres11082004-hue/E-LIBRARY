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

const CATEGORIES = ["All", "Fiction", "Non-Fiction", "Science", "Technology", "History", "Philosophy", "Mathematics", "Literature", "Reference", "Thesis"];

function BookCard({ book, inMyList, onAdd }: { book: any; inMyList: boolean; onAdd: (e: React.MouseEvent) => void }) {
  const [, setLocation] = useLocation();

  return (
    <div
      className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all group cursor-pointer flex flex-col"
      onClick={() => setLocation(`/books/${book.id}`)}
    >
      <div className="h-44 bg-muted flex items-center justify-center overflow-hidden relative shrink-0">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
            <BookOpen className="w-10 h-10 opacity-30" />
            <span className="text-xs font-medium">{book.category}</span>
          </div>
        )}
        {/* Read badge on hover */}
        <div className="absolute inset-0 bg-primary/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col items-center gap-1 text-white">
            <BookText className="w-7 h-7" />
            <span className="text-xs font-semibold">Open Book</span>
          </div>
        </div>
        {/* Availability chips — top-left */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {book.fileUrl && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-600/90 text-white leading-tight">Digital</span>
          )}
          {book.isAvailablePhysical && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-600/90 text-white leading-tight">Physical</span>
          )}
        </div>
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">{book.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-2">{book.author}</p>
        <div className="mt-auto space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full truncate">{book.category}</span>
            <Button
              size="sm"
              variant={inMyList ? "secondary" : "outline"}
              className="shrink-0 h-7 text-xs gap-1"
              onClick={(e) => { e.stopPropagation(); onAdd(e); }}
              disabled={inMyList}
            >
              <BookMarked className="w-3 h-3" />
              {inMyList ? "Saved" : "Save"}
            </Button>
          </div>
          {(book.fileUrl || book.content) && (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                if (book.fileUrl) {
                  window.open(book.fileUrl, "_blank", "noopener,noreferrer");
                } else if (book.content) {
                  const blob = new Blob([book.content], { type: "text/markdown;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", `${book.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
              }}
            >
              <Download className="w-3 h-3" />
              Download
            </Button>
          )}
          {book.isAvailablePhysical && (
            <p className="text-xs text-green-600 font-medium">
              {book.availableCopies}/{book.totalCopies} copies available
            </p>
          )}
        </div>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl overflow-hidden animate-pulse">
              <div className="h-44 bg-muted" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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

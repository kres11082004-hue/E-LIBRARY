import { useState } from "react";
import { useLocation } from "wouter";
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

const CATEGORIES = ["All", "Computer Science", "Information Systems", "Programming", "Database Management", "Networking & Security", "Physical Education", "Sports Science", "Health & Fitness", "Mathematics", "General Education", "Thesis & Research"];

function BookCard({ book, inMyList, userId, onAdd }: { book: any; inMyList: boolean; userId?: number; onAdd: () => void }) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer group"
      onClick={() => setLocation(`/books/${book.id}`)}
    >
      {/* Cover Image */}
      <div className="h-44 bg-muted flex items-center justify-center overflow-hidden relative">
        {book.coverUrl && !imgError ? (
          <img
            src={book.coverUrl}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-3 text-center text-white relative">
            <BookOpen className="w-8 h-8 opacity-40 mb-1 z-10" />
            <span className="text-xs font-bold line-clamp-2 z-10 leading-tight">{book.title}</span>
            <span className="text-[10px] text-slate-300 mt-1 z-10 opacity-80">{book.category}</span>
          </div>
        )}

        {/* Digital / Physical badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {book.fileUrl && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-600/90 text-white leading-tight">Digital</span>
          )}
          {book.isAvailablePhysical && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-600/90 text-white leading-tight">Physical</span>
          )}
        </div>

        {/* Hover action overlay */}
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {book.fileUrl ? (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white w-28"
              onClick={(e) => {
                e.stopPropagation();
                if (!userId) return;
                triggerBookDownload(userId, book);
                toast({ title: "Download started", description: `"${book.title}" is being downloaded.` });
              }}
            >
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
          ) : (
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs w-28"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/books/${book.id}/read`);
              }}
            >
              <BookText className="w-3.5 h-3.5" /> Read
            </Button>
          )}
          <Button
            size="sm"
            variant={inMyList ? "secondary" : "outline"}
            className="h-8 text-xs gap-1.5 w-28"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
            disabled={inMyList}
          >
            <BookMarked className="w-3.5 h-3.5" />
            {inMyList ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3">
        <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {book.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
        {book.isbn && (
          <p className="text-xs text-muted-foreground/60 font-mono mt-0.5">ISBN: {book.isbn}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
            {book.category}
          </span>
          {book.isAvailablePhysical && (
            <span className="text-xs text-green-600 font-medium">
              {book.availableCopies}/{book.totalCopies} copies
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BooksPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(window.location.search);
  const departmentFilter = searchParams.get("department");

  const { data: booksRaw = [], isLoading } = useListBooks({
    search: search || undefined,
    category: category !== "All" ? category : undefined,
  });
  
  const books = booksRaw.filter(b => {
    if (!departmentFilter) return true;
    const dept = (b.department || "").toLowerCase();
    const title = (b.title || "").toLowerCase();
    const cat = (b.category || "").toLowerCase();
    
    if (departmentFilter === "BPED") {
      return dept.includes("bped") || dept.includes("physical education") || cat.includes("education") || title.includes("sport") || title.includes("physic");
    } else if (departmentFilter === "BSIS") {
      // Anything that is not BPED is currently considered BSIS
      const isBped = dept.includes("bped") || dept.includes("physical education") || cat.includes("education") || title.includes("sport") || title.includes("physic");
      return !isBped;
    }
    return true;
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
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {departmentFilter && (
              <span className={`text-xs px-2 py-1 rounded-full text-white ${departmentFilter === 'BSIS' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                {departmentFilter}
              </span>
            )}
            Browse Library
          </h1>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl overflow-hidden animate-pulse">
              <div className="h-44 bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-4/5" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-3 bg-muted rounded w-2/3" />
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              inMyList={myListIds.has(book.id)}
              userId={user?.id}
              onAdd={() => handleAdd(book.id, book.title)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

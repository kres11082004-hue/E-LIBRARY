import { useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useListBooks } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { Search, BookOpen, Filter, Plus, Building2, ArrowLeft } from "lucide-react";
import { BackButton } from "@/components/back-button";

const CATEGORIES = ["All", "Computer Science", "Information Systems", "Programming", "Database Management", "Networking & Security", "Physical Education", "Sports Science", "Health & Fitness", "Mathematics", "General Education", "Thesis & Research"];

function BookCard({ book }: { book: any }) {
  const [, setLocation] = useLocation();
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
  const [, setLocation] = useLocation();

  const searchStr = useSearch();
  const searchParams = useMemo(() => new URLSearchParams(searchStr), [searchStr]);
  const departmentFilter = searchParams.get("department");

  const { data: booksRaw = [], isLoading } = useListBooks({
    search: search || undefined,
    category: category !== "All" ? category : undefined,
  });

  const { bsisCount, bpedCount } = useMemo(() => {
    let bsis = 0;
    let bped = 0;
    booksRaw.forEach((b: any) => {
      const dept = (b.department || "").toLowerCase();
      const title = (b.title || "").toLowerCase();
      const cat = (b.category || "").toLowerCase();
      if (dept.includes("bped") || dept.includes("physical education") || cat.includes("education") || title.includes("sport") || title.includes("physic")) {
        bped++;
      } else {
        bsis++;
      }
    });
    return { bsisCount: bsis, bpedCount: bped };
  }, [booksRaw]);

  const books = booksRaw.filter((b: any) => {
    if (!departmentFilter) return true;
    const dept = (b.department || "").toLowerCase();
    const title = (b.title || "").toLowerCase();
    const cat = (b.category || "").toLowerCase();

    if (departmentFilter === "BPED") {
      return dept.includes("bped") || dept.includes("physical education") || cat.includes("education") || title.includes("sport") || title.includes("physic");
    } else if (departmentFilter === "BSIS") {
      const isBped = dept.includes("bped") || dept.includes("physical education") || cat.includes("education") || title.includes("sport") || title.includes("physic");
      return !isBped;
    }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <BackButton />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {departmentFilter ? (
              <>
                <button
                  onClick={() => setLocation("/books")}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className={`text-xs px-2 py-1 rounded-full text-white ${departmentFilter === "BSIS" ? "bg-blue-600" : "bg-emerald-600"}`}>
                  {departmentFilter}
                </span>
                Browse Library
              </>
            ) : (
              "Browse Library"
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {departmentFilter
              ? `${books.length} books in ${departmentFilter === "BSIS" ? "Dept. of Information System" : "Dept. of Physical Education"}`
              : `${booksRaw.length} books available — click any department to explore`}
          </p>
        </div>
        {(user?.role === "admin" || user?.role === "librarian") && (
          <Button onClick={() => setLocation("/admin/books")} className="gap-2">
            <Plus className="w-4 h-4" /> Add Book
          </Button>
        )}
      </div>

      {/* Department Libraries — only shown when NOT filtered */}
      {!departmentFilter && (
        <div className="space-y-6">
          {/* Hero Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10">
            {/* Decorative floating elements */}
            <div className="absolute top-4 right-8 w-20 h-20 rounded-full bg-blue-500/10 blur-2xl animate-pulse pointer-events-none" />
            <div className="absolute bottom-4 left-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl animate-pulse pointer-events-none" style={{ animationDelay: "1s" }} />
            <div className="absolute top-1/2 right-1/3 w-16 h-16 rounded-full bg-indigo-400/10 blur-xl animate-pulse pointer-events-none" style={{ animationDelay: "2s" }} />

            <div className="relative z-10 text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-4">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">Department Libraries</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
                Explore Your Department
              </h2>
              <p className="text-sm md:text-base text-slate-300 max-w-lg mx-auto leading-relaxed">
                Browse dedicated resources for <span className="text-blue-400 font-semibold">BSIS</span> (Information System) & <span className="text-emerald-400 font-semibold">BPED</span> (Physical Education)
              </p>
              <p className="text-xs text-slate-400 mt-2">{booksRaw.length} total books available across all departments</p>
            </div>
          </div>

          {/* Department Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* BSIS Card */}
            <div
              onClick={() => setLocation("/books?department=BSIS")}
              className="group relative overflow-hidden rounded-2xl border-2 border-blue-500/20 hover:border-blue-500/50 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-card p-7 md:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 cursor-pointer min-h-[200px] flex flex-col justify-between"
            >
              {/* Background decoration */}
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors duration-500 pointer-events-none" />
              <div className="absolute -right-2 -bottom-8 w-24 h-24 rounded-full bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors duration-500 pointer-events-none" />

              <div className="relative z-10 pointer-events-none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-extrabold text-sm">BSIS</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Dept. of Information System</span>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-blue-600 transition-colors leading-tight">
                  Bachelor of Science in Information System
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Computer Science, Programming, Database, Networking & more
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-5 pt-4 border-t border-blue-500/10 pointer-events-none">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5 group-hover:gap-3 transition-all">
                  Explore resources <ArrowLeft className="w-4 h-4 rotate-180" />
                </span>
                <div className="text-right">
                  <p className="text-4xl font-black text-blue-600 dark:text-blue-400 leading-none">{bsisCount}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Books</p>
                </div>
              </div>
            </div>

            {/* BPED Card */}
            <div
              onClick={() => setLocation("/books?department=BPED")}
              className="group relative overflow-hidden rounded-2xl border-2 border-emerald-500/20 hover:border-emerald-500/50 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-card p-7 md:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 cursor-pointer min-h-[200px] flex flex-col justify-between"
            >
              {/* Background decoration */}
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors duration-500 pointer-events-none" />
              <div className="absolute -right-2 -bottom-8 w-24 h-24 rounded-full bg-teal-500/5 group-hover:bg-teal-500/10 transition-colors duration-500 pointer-events-none" />

              <div className="relative z-10 pointer-events-none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-extrabold text-sm">BPED</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Dept. of Physical Education</span>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-emerald-600 transition-colors leading-tight">
                  Bachelor of Physical Education
                </h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Sports Science, Health & Fitness, Physical Education & more
                </p>
              </div>

              <div className="relative z-10 flex items-center justify-between mt-5 pt-4 border-t border-emerald-500/10 pointer-events-none">
                <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 group-hover:gap-3 transition-all">
                  Explore resources <ArrowLeft className="w-4 h-4 rotate-180" />
                </span>
                <div className="text-right">
                  <p className="text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{bpedCount}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Books</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Books Grid — only shown when a department is selected */}
      {departmentFilter && (
        <>
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
              {books.map((book: any) => (
                <BookCard
                  key={book.id}
                  book={book}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

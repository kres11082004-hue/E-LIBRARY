import { useAuth } from "@/lib/auth-context";
import { useListBooks, useGetMyList, useGetMonitoringStats, useGetRecentActivity, useListBorrowRecords } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, BookMarked, Users, AlertTriangle, Clock, ArrowRight, Library, Building2 } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

function StatCard({ label, value, icon: Icon, color, href }: { label: string; value: number; icon: React.ElementType; color: string; href?: string }) {
  const CardContent = (
    <div className="bg-card border rounded-xl p-5 hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className="text-3xl font-bold text-foreground">{value.toLocaleString()}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{CardContent}</Link>;
  }
  return CardContent;
}

function BookCard({ book }: { book: any }) {
  return (
    <Link href={`/books/${book.id}`}>
      <div className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group h-full flex flex-col">
        <div className="h-40 bg-muted flex items-center justify-center overflow-hidden relative shrink-0">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <BookOpen className="w-8 h-8" />
              <span className="text-[10px]">{book.category}</span>
            </div>
          )}
          {/* Availability chips */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {book.fileUrl && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-600/90 text-white leading-tight shadow-sm">Digital</span>
            )}
            {book.isAvailablePhysical && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-600/90 text-white leading-tight shadow-sm">Physical</span>
            )}
          </div>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">{book.title}</p>
          <p className="text-xs text-muted-foreground mt-1 flex-1">{book.author}</p>
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full font-medium">{book.category}</span>
            {book.isAvailablePhysical && (
              <span className="text-[10px] text-green-600 font-bold">{book.availableCopies}/{book.totalCopies} copies</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "librarian";

  const { data: books = [] } = useListBooks();
  const { data: myList = [] } = useGetMyList();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: stats } = useGetMonitoringStats({ query: { enabled: isAdmin } as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: activity = [] } = useGetRecentActivity({ query: { enabled: isAdmin } as any });
  const { data: borrows = [] } = useListBorrowRecords();

  const recentBooks = [...books].sort((a, b) => b.id - a.id).slice(0, 4);

  const { bsisCount, bpedCount } = useMemo(() => {
    let bsis = 0;
    let bped = 0;
    books.forEach((b: any) => {
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
  }, [books]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <BackButton />
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          {greeting}, {user?.fullname?.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {user?.campus} — <span className="capitalize">{user?.role}</span> Dashboard
        </p>
      </div>

      {/* Admin Stats or User Summary */}
      {isAdmin && stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-primary/10 text-primary" href="/admin/users" />
          <StatCard label="Total Books" value={stats.totalBooks} icon={BookOpen} color="bg-green-500/10 text-green-600" href="/admin/books" />
          <StatCard label="Active Borrows" value={stats.activeBorrows} icon={BookMarked} color="bg-amber-500/10 text-amber-600" href="/admin/monitoring" />
          <StatCard label="Overdue" value={stats.overdueBooks ?? 0} icon={AlertTriangle} color="bg-red-500/10 text-red-600" href="/admin/monitoring" />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Books Available" value={books.length} icon={BookOpen} color="bg-primary/10 text-primary" href="/books" />
          <StatCard label="My Reading List" value={myList.length} icon={BookMarked} color="bg-indigo-500/10 text-indigo-600" href="/my-list" />
          <StatCard label="My Active Borrows" value={borrows.filter(b => b.status === "borrowed" || b.status === "overdue").length} icon={Library} color="bg-amber-500/10 text-amber-600" href="/borrowed" />
          <StatCard label="New Arrivals" value={recentBooks.length} icon={Clock} color="bg-green-500/10 text-green-600" href="/books" />
        </div>
      )}

      {/* Department Workspaces Section */}
      <div className="bg-card border rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Department Libraries
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Browse dedicated resources for <strong>BSIS</strong> (Information System) &amp; <strong>BPED</strong> (Physical Education)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href={isAdmin ? "/admin/books?department=BSIS" : "/books?department=BSIS"}>
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/30 rounded-xl p-5 flex items-center justify-between hover:shadow-lg hover:border-blue-500/60 transition-all cursor-pointer group h-full">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default" className="bg-blue-600 text-white group-hover:bg-blue-700">BSIS</Badge>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Dept. of Information System</span>
                </div>
                <p className="font-bold text-foreground text-sm mt-1.5 group-hover:text-blue-600 transition-colors">Bachelor of Science in Information System</p>
                <p className="text-xs text-blue-600 font-medium mt-1.5 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Click to explore resources &rarr;
                </p>
              </div>
              <div className="text-right pl-3 shrink-0">
                <p className="text-3xl font-extrabold text-blue-600">{bsisCount}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Books</p>
              </div>
            </div>
          </Link>

          <Link href={isAdmin ? "/admin/books?department=BPED" : "/books?department=BPED"}>
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-xl p-5 flex items-center justify-between hover:shadow-lg hover:border-emerald-500/60 transition-all cursor-pointer group h-full">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default" className="bg-emerald-600 text-white group-hover:bg-emerald-700">BPED</Badge>
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Dept. of Physical Education</span>
                </div>
                <p className="font-bold text-foreground text-sm mt-1.5 group-hover:text-emerald-600 transition-colors">Bachelor of Physical Education</p>
                <p className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  Click to explore resources &rarr;
                </p>
              </div>
              <div className="text-right pl-3 shrink-0">
                <p className="text-3xl font-extrabold text-emerald-600">{bpedCount}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase">Books</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recently Added Books */}
        <div className="lg:col-span-2 space-y-4 bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b">
            <div>
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Library className="w-5 h-5 text-primary" /> New Arrivals
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest additions to the digital library</p>
            </div>
            <Link href="/books">
              <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </div>
          
          {recentBooks.length === 0 ? (
            <div className="py-12 flex flex-col items-center text-center gap-3">
              <BookOpen className="w-10 h-10 text-muted-foreground/30" />
              <div>
                <p className="font-medium text-foreground">No books available yet</p>
                <p className="text-muted-foreground text-xs">The library collection is currently empty.</p>
              </div>
              {isAdmin && <Link href="/admin/books"><Button size="sm" className="mt-2">Add First Book</Button></Link>}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {recentBooks.map(book => <BookCard key={book.id} book={book} />)}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        {isAdmin && activity.length > 0 && (
          <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col">
            <div className="pb-4 border-b mb-4">
              <h2 className="font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Recent Activity
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest actions across all campuses</p>
            </div>
            
            <div className="space-y-3 flex-1 overflow-y-auto pr-2">
              {activity.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/30 border border-transparent hover:border-border rounded-lg transition-colors">
                  <div className="bg-background p-1.5 rounded-md shrink-0 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] text-foreground font-medium leading-snug">{item.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{item.campus}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-2 border-t text-center">
              <Link href="/admin/reports">
                <Button variant="outline" size="sm" className="w-full text-xs">View Full Activity Log</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

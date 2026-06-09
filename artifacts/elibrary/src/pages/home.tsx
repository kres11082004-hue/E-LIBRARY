import { useAuth } from "@/lib/auth-context";
import { useListBooks, useGetMyList, useGetMonitoringStats, useGetRecentActivity } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, BookMarked, Users, TrendingUp, Clock, ArrowRight, Library } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-card border rounded-xl p-5">
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
}

function BookCard({ book }: { book: any }) {
  return (
    <Link href={`/books/${book.id}`}>
      <div className="bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
        <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <BookOpen className="w-8 h-8" />
              <span className="text-xs">{book.category}</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">{book.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{book.author}</p>
          <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{book.category}</span>
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

  const recentBooks = [...books].sort((a, b) => b.id - a.id).slice(0, 6);
  const myListBooks = myList.slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{greeting}, {user?.fullname?.split(" ")[0]}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {user?.campus} — <span className="capitalize">{user?.role}</span>
        </p>
      </div>

      {/* Admin Stats */}
      {isAdmin && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-primary/10 text-primary" />
          <StatCard label="Total Books" value={stats.totalBooks} icon={BookOpen} color="bg-green-500/10 text-green-600" />
          <StatCard label="Active Borrows" value={stats.activeBorrows} icon={BookMarked} color="bg-amber-500/10 text-amber-600" />
          <StatCard label="Overdue" value={stats.overdueBooks ?? 0} icon={TrendingUp} color="bg-red-500/10 text-red-600" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/books">
          <Button variant="outline" className="gap-2"><BookOpen className="w-4 h-4" /> Browse Library</Button>
        </Link>
        <Link href="/my-list">
          <Button variant="outline" className="gap-2"><BookMarked className="w-4 h-4" /> My Reading List ({myList.length})</Button>
        </Link>
        {isAdmin && (
          <Link href="/admin/monitoring">
            <Button variant="outline" className="gap-2"><TrendingUp className="w-4 h-4" /> Monitoring</Button>
          </Link>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recently Added Books */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Recently Added</h2>
            <Link href="/books">
              <button className="text-sm text-primary flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </Link>
          </div>
          {recentBooks.length === 0 ? (
            <div className="bg-card border rounded-xl p-12 flex flex-col items-center text-center gap-4">
              <Library className="w-12 h-12 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-foreground">No books yet</p>
                <p className="text-muted-foreground text-sm">The library collection is empty.</p>
              </div>
              {isAdmin && <Link href="/admin/books"><Button size="sm">Add First Book</Button></Link>}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {recentBooks.map(book => <BookCard key={book.id} book={book} />)}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* My Reading List Preview */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-foreground">My Reading List</h2>
              <Link href="/my-list"><button className="text-sm text-primary hover:underline">View all</button></Link>
            </div>
            {myListBooks.length === 0 ? (
              <div className="bg-card border rounded-xl p-6 text-center">
                <BookMarked className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No books saved yet</p>
                <Link href="/books"><Button size="sm" variant="outline" className="mt-3">Browse Books</Button></Link>
              </div>
            ) : (
              <div className="space-y-2">
                {myListBooks.map(item => (
                  <Link href={`/books/${item.bookId}`} key={item.id}>
                    <div className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="w-8 h-10 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="w-4 h-4 text-primary" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-foreground truncate">{item.book.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.book.author}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity (admin) */}
          {isAdmin && activity.length > 0 && (
            <div>
              <h2 className="font-semibold text-foreground mb-3">Recent Activity</h2>
              <div className="space-y-2">
                {activity.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-card border rounded-lg">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-sm text-foreground leading-snug">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.campus}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

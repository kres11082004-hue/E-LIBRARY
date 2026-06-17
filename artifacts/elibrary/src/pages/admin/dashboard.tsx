import { useGetMonitoringStats, useListBorrowRecords, useListUsers } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, BookOpen, AlertTriangle, BookMarked } from "lucide-react";

import { Link } from "wouter";

function StatCard({ label, value, icon: Icon, color, href }: { label: string; value: number; icon: React.ElementType; color: string; href: string }) {
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

  return (
    <Link href={href}>
      {CardContent}
    </Link>
  );
}

export default function AdminDashboardPage() {
  const { data: stats } = useGetMonitoringStats();
  const { data: borrows = [] } = useListBorrowRecords();
  const { data: users = [] } = useListUsers();

  const topBooksMap = new Map<string, number>();
  const borrowsByYearMap = new Map<string, number>();
  const borrowsByCourseMap = new Map<string, number>();

  borrows.forEach(b => {
    if (b.book?.title) {
      topBooksMap.set(b.book.title, (topBooksMap.get(b.book.title) || 0) + 1);
    }
    const user = users.find(u => u.id === b.userId) || b.user;
    if (user?.year) {
      borrowsByYearMap.set(user.year, (borrowsByYearMap.get(user.year) || 0) + 1);
    }
    if (user?.course) {
      borrowsByCourseMap.set(user.course, (borrowsByCourseMap.get(user.course) || 0) + 1);
    }
  });

  const topBooksData = Array.from(topBooksMap.entries()).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  const borrowsByYearData = Array.from(borrowsByYearMap.entries()).map(([year, borrows]) => ({ year, borrows })).sort((a, b) => a.year.localeCompare(b.year));
  const borrowsByCourseData = Array.from(borrowsByCourseMap.entries()).map(([course, borrows]) => ({ course, borrows })).sort((a, b) => b.borrows - a.borrows).slice(0, 10);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of library activity and usage</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-primary/10 text-primary" href="/admin/users" />
          <StatCard label="Total Books" value={stats.totalBooks} icon={BookOpen} color="bg-green-500/10 text-green-600" href="/admin/books" />
          <StatCard label="Active Borrows" value={stats.activeBorrows} icon={BookMarked} color="bg-amber-500/10 text-amber-600" href="/admin/monitoring" />
          <StatCard label="Overdue" value={stats.overdueBooks ?? 0} icon={AlertTriangle} color="bg-red-500/10 text-red-600" href="/admin/monitoring" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-xl p-4 lg:col-span-1">
          <h3 className="font-semibold text-sm text-foreground mb-4">Most Borrowed Books (Physical)</h3>
          {topBooksData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topBooksData} margin={{ top: 0, right: 20, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={true} vertical={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip cursor={{fill: 'var(--muted)'}} />
                <Bar dataKey="count" name="Borrows" fill="hsl(var(--primary))" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-4 lg:col-span-1">
          <h3 className="font-semibold text-sm text-foreground mb-4">Most Browsed Books (Online)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={[
                { title: "Advanced Mathematics", views: 450 },
                { title: "Introduction to Programming", views: 380 },
                { title: "World History", views: 310 },
                { title: "Physics Vol 1", views: 250 },
                { title: "Basic Chemistry", views: 190 },
                { title: "Literature 101", views: 150 },
              ]} 
              margin={{ top: 0, right: 20, left: 0, bottom: 0 }} 
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={true} vertical={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={120} />
              <Tooltip cursor={{fill: 'var(--muted)'}} />
              <Bar dataKey="views" name="Views" fill="hsl(280,60%,55%)" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm text-foreground mb-4">Borrows by Year Level</h3>
          {borrowsByYearData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={borrowsByYearData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip cursor={{fill: 'var(--muted)'}} />
                <Bar dataKey="borrows" name="Borrows" fill="hsl(220,60%,30%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          )}
        </div>

        <div className="bg-card border rounded-xl p-4">
          <h3 className="font-semibold text-sm text-foreground mb-4">Borrows by Course</h3>
          {borrowsByCourseData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={borrowsByCourseData} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="course" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip cursor={{fill: 'var(--muted)'}} />
                <Bar dataKey="borrows" name="Borrows" fill="hsl(40,70%,55%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No data available</div>
          )}
        </div>
      </div>
    </div>
  );
}

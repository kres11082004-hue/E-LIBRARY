import { useState } from "react";
import { useGetMonitoringStats, useListBorrowRecords, useListUsers } from "@workspace/api-client-react";

import { Users, BookOpen, AlertTriangle, BookMarked, Building2, GraduationCap } from "lucide-react";
import { Link } from "wouter";
import { BackButton } from "@/components/back-button";
import { getCourseInfo, DEPARTMENTS } from "@/lib/department-utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

const DEPT_COLORS: Record<string, string> = {
  "Department of Information System (BSIS)": "hsl(217, 91%, 55%)",
  "Department of Physical Education (BPED)": "hsl(160, 84%, 39%)",
};

export default function AdminDashboardPage() {
  const { data: stats } = useGetMonitoringStats();
  const { data: borrows = [] } = useListBorrowRecords();
  const { data: users = [] } = useListUsers();
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("All");

  const topBooksMap = new Map<string, number>();
  const borrowsByYearMap = new Map<string, number>();
  const borrowsByCourseMap = new Map<string, { code: string; fullName: string; department: string; count: number }>();
  const borrowsByDeptMap = new Map<string, { department: string; borrows: number; students: number }>();

  // Initialize departments
  DEPARTMENTS.forEach(dept => {
    borrowsByDeptMap.set(dept, { department: dept, borrows: 0, students: 0 });
  });

  // Aggregate user counts per department
  users.forEach(u => {
    if (u.role === "student") {
      const info = getCourseInfo(u.course);
      if (borrowsByDeptMap.has(info.department)) {
        borrowsByDeptMap.get(info.department)!.students += 1;
      } else {
        borrowsByDeptMap.set(info.department, { department: info.department, borrows: 0, students: 1 });
      }
    }
  });

  // Aggregate borrows
  borrows.forEach(b => {
    if (b.book?.title) {
      topBooksMap.set(b.book.title, (topBooksMap.get(b.book.title) || 0) + 1);
    }
    const user = users.find(u => u.id === b.userId) || b.user;
    if (user?.year) {
      borrowsByYearMap.set(user.year, (borrowsByYearMap.get(user.year) || 0) + 1);
    }
    
    const info = getCourseInfo(user?.course);
    const key = info.code;
    if (!borrowsByCourseMap.has(key)) {
      borrowsByCourseMap.set(key, { code: info.code, fullName: info.fullName, department: info.department, count: 0 });
    }
    borrowsByCourseMap.get(key)!.count += 1;

    if (borrowsByDeptMap.has(info.department)) {
      borrowsByDeptMap.get(info.department)!.borrows += 1;
    }
  });

  const topBooksData = Array.from(topBooksMap.entries()).map(([title, count]) => ({ title, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  const borrowsByYearData = Array.from(borrowsByYearMap.entries()).map(([year, borrows]) => ({ year, borrows })).sort((a, b) => a.year.localeCompare(b.year));
  const borrowsByCourseData = Array.from(borrowsByCourseMap.values()).sort((a, b) => b.count - a.count);
  const borrowsByDeptData = Array.from(borrowsByDeptMap.values()).filter(d => d.students > 0 || d.borrows > 0);

  // Filtered course data for Department breakdown
  const filteredCoursesData = selectedDeptFilter === "All"
    ? borrowsByCourseData
    : borrowsByCourseData.filter(c => c.department === selectedDeptFilter);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Overview of library activity, courses, and department metrics</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-primary/10 text-primary" href="/admin/users" />
          <StatCard label="Total Books" value={stats.totalBooks} icon={BookOpen} color="bg-green-500/10 text-green-600" href="/admin/books" />
          <StatCard label="Active Borrows" value={stats.activeBorrows} icon={BookMarked} color="bg-amber-500/10 text-amber-600" href="/admin/monitoring" />
          <StatCard label="Overdue" value={stats.overdueBooks ?? 0} icon={AlertTriangle} color="bg-red-500/10 text-red-600" href="/admin/monitoring" />
        </div>
      )}

      {/* DEPARTMENT BY COURSE SECTION */}
      <div className="bg-card border rounded-xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Department by Course Breakdown
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Categorized analytics separating <strong>BSIS</strong> (Information System) &amp; <strong>BPED</strong> (Physical Education)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedDeptFilter} onValueChange={setSelectedDeptFilter}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Filter Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Departments</SelectItem>
                {DEPARTMENTS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clickable Department Cards for BSIS & BPED */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/admin/books?department=BSIS">
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/30 rounded-xl p-5 flex items-center justify-between hover:shadow-lg hover:border-blue-500/60 transition-all cursor-pointer group">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-blue-600 text-white group-hover:bg-blue-700">BSIS</Badge>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dept. of Information System (BSIS)</span>
                </div>
                <p className="font-bold text-foreground text-sm mt-1.5 group-hover:text-blue-600 transition-colors">Bachelor of Science in Information System</p>
                <p className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                  Click to view &amp; add department books &rarr;
                </p>
              </div>
              <div className="text-right pl-3 shrink-0">
                <p className="text-3xl font-extrabold text-blue-600">
                  {borrowsByCourseMap.get("BSIS")?.count || 0}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase">Borrows</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/books?department=BPED">
            <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-xl p-5 flex items-center justify-between hover:shadow-lg hover:border-emerald-500/60 transition-all cursor-pointer group">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-emerald-600 text-white group-hover:bg-emerald-700">BPED</Badge>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dept. of Physical Education (BPED)</span>
                </div>
                <p className="font-bold text-foreground text-sm mt-1.5 group-hover:text-emerald-600 transition-colors">Bachelor of Physical Education</p>
                <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  Click to view &amp; add department books &rarr;
                </p>
              </div>
              <div className="text-right pl-3 shrink-0">
                <p className="text-3xl font-extrabold text-emerald-600">
                  {borrowsByCourseMap.get("BPED")?.count || 0}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase">Borrows</p>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}

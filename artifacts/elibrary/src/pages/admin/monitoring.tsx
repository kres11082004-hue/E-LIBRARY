import { useState } from "react";
import { useGetMonitoringStats, useGetMonitoringByCampus, useGetMonitoringByCourse, useGetRecentActivity, useListBorrowRecords, useCreateBorrowRecord, useUpdateBorrowRecord, useListUsers, getListBorrowRecordsQueryKey, getGetMonitoringStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, BookOpen, AlertTriangle, BookMarked, Building, GraduationCap, Clock, Plus, CheckCircle, TrendingUp } from "lucide-react";

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

export default function AdminMonitoringPage() {
  const [showBorrowDialog, setShowBorrowDialog] = useState(false);
  const [borrowForm, setBorrowForm] = useState({ userId: "", bookId: "", dueDate: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useGetMonitoringStats();
  const { data: byCampus = [] } = useGetMonitoringByCampus();
  const { data: byCourse = [] } = useGetMonitoringByCourse();
  const { data: activity = [] } = useGetRecentActivity();
  const { data: borrows = [] } = useListBorrowRecords();
  const { data: users = [] } = useListUsers();

  const createBorrowMutation = useCreateBorrowRecord();
  const updateBorrowMutation = useUpdateBorrowRecord();

  const handleBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBorrowMutation.mutateAsync({
        data: {
          userId: parseInt(borrowForm.userId),
          bookId: parseInt(borrowForm.bookId),
          dueDate: borrowForm.dueDate,
        },
      });
      queryClient.invalidateQueries({ queryKey: getListBorrowRecordsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMonitoringStatsQueryKey() });
      toast({ title: "Borrow record created" });
      setShowBorrowDialog(false);
      setBorrowForm({ userId: "", bookId: "", dueDate: "" });
    } catch (err: any) {
      toast({ title: err?.data?.error || "Failed to create borrow record", variant: "destructive" });
    }
  };

  const handleReturn = async (id: number) => {
    try {
      await updateBorrowMutation.mutateAsync({
        id,
        data: { status: "returned", returnedAt: new Date().toISOString() },
      });
      queryClient.invalidateQueries({ queryKey: getListBorrowRecordsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetMonitoringStatsQueryKey() });
      toast({ title: "Book returned successfully" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const activeBorrows = borrows.filter(b => b.status === "borrowed");
  const overdueBorrows = borrows.filter(b => b.status === "overdue");

  // Derived data for graphs
  const topBooksMap = new Map<string, number>();
  const borrowsByYearMap = new Map<string, number>();
  const borrowsByCourseMap = new Map<string, number>();

  borrows.forEach(b => {
    // Book uses
    if (b.book?.title) {
      topBooksMap.set(b.book.title, (topBooksMap.get(b.book.title) || 0) + 1);
    }
    // User stats
    const user = users.find(u => u.id === b.userId) || b.user;
    if (user?.year) {
      borrowsByYearMap.set(user.year, (borrowsByYearMap.get(user.year) || 0) + 1);
    }
    if (user?.course) {
      borrowsByCourseMap.set(user.course, (borrowsByCourseMap.get(user.course) || 0) + 1);
    }
  });

  const topBooksData = Array.from(topBooksMap.entries())
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const borrowsByYearData = Array.from(borrowsByYearMap.entries())
    .map(([year, borrows]) => ({ year, borrows }))
    .sort((a, b) => a.year.localeCompare(b.year));

  const borrowsByCourseData = Array.from(borrowsByCourseMap.entries())
    .map(([course, borrows]) => ({ course, borrows }))
    .sort((a, b) => b.borrows - a.borrows)
    .slice(0, 10);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Library Monitoring</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Physical library and user activity overview</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="bg-primary/10 text-primary" />
          <StatCard label="Total Books" value={stats.totalBooks} icon={BookOpen} color="bg-green-500/10 text-green-600" />
          <StatCard label="Active Borrows" value={stats.activeBorrows} icon={BookMarked} color="bg-amber-500/10 text-amber-600" />
          <StatCard label="Overdue" value={stats.overdueBooks ?? 0} icon={AlertTriangle} color="bg-red-500/10 text-red-600" />
        </div>
      )}

      <Tabs defaultValue="analytics">
        <TabsList>
          <TabsTrigger value="analytics" className="gap-2"><TrendingUp className="w-3 h-3" /> Analytics Graphs</TabsTrigger>
          <TabsTrigger value="campus" className="gap-2"><Building className="w-3 h-3" /> By Campus</TabsTrigger>
          <TabsTrigger value="course" className="gap-2"><GraduationCap className="w-3 h-3" /> By Course</TabsTrigger>
          <TabsTrigger value="borrows" className="gap-2"><BookMarked className="w-3 h-3" /> Borrow Records</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2"><Clock className="w-3 h-3" /> Activity</TabsTrigger>
        </TabsList>

        {/* Analytics Graphs */}
        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Most Borrowed Books */}
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

            {/* Most Browsed Books */}
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

            </div>

            {/* By Year */}
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

            {/* By Course */}
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
        </TabsContent>

        {/* By Campus */}
        <TabsContent value="campus" className="space-y-4 mt-4">
          {byCampus.length > 0 && (
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold text-sm text-foreground mb-4">Users by Campus</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byCampus} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="campus" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="students" name="Students" fill="hsl(220,60%,30%)" radius={[4,4,0,0]} />
                  <Bar dataKey="instructors" name="Instructors" fill="hsl(40,70%,55%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Campus</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Students</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Instructors</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Active Borrows</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byCampus.map((row) => (
                  <tr key={row.campus} className="hover:bg-muted/20">
                    <td className="p-4 font-medium text-sm">{row.campus}</td>
                    <td className="p-4 text-right text-sm">{row.students}</td>
                    <td className="p-4 text-right text-sm">{row.instructors}</td>
                    <td className="p-4 text-right text-sm font-medium text-amber-600">{row.activeBorrows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* By Course */}
        <TabsContent value="course" className="mt-4">
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Course</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Year / Section</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Campus</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Students</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Borrows</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byCourse.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No student data yet</td></tr>
                ) : byCourse.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="p-4 text-sm font-medium max-w-xs"><span className="line-clamp-2">{row.course}</span></td>
                    <td className="p-4 text-sm text-muted-foreground hidden md:table-cell">{row.year} — Sec {row.section}</td>
                    <td className="p-4 text-sm text-muted-foreground hidden lg:table-cell">{row.campus}</td>
                    <td className="p-4 text-right text-sm">{row.studentCount}</td>
                    <td className="p-4 text-right text-sm font-medium text-amber-600">{row.activeBorrows}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Borrow Records */}
        <TabsContent value="borrows" className="space-y-4 mt-4">
          {overdueBorrows.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> {overdueBorrows.length} overdue {overdueBorrows.length === 1 ? "book" : "books"}
              </p>
            </div>
          )}
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Borrower</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Book</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Due Date</th>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {borrows.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No borrow records</td></tr>
                ) : borrows.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/20">
                    <td className="p-4">
                      <p className="text-sm font-medium text-foreground">{record.user?.fullname}</p>
                      <p className="text-xs text-muted-foreground">{record.user?.campus}</p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <p className="text-sm text-foreground line-clamp-1">{record.book?.title}</p>
                    </td>
                    <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">
                      {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : "—"}
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        record.status === "returned" ? "bg-green-100 text-green-700" :
                        record.status === "overdue" ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{record.status}</span>
                    </td>
                    <td className="p-4 text-right">
                      {record.status === "borrowed" && (
                        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => handleReturn(record.id)} disabled={updateBorrowMutation.isPending}>
                          <CheckCircle className="w-3 h-3" /> Return
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Activity Feed */}
        <TabsContent value="activity" className="mt-4">
          {activity.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Clock className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activity.map((item) => (
                <div key={item.id} className="bg-card border rounded-xl p-4 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    item.type === "borrow" ? "bg-amber-100 text-amber-700" :
                    item.type === "return" ? "bg-green-100 text-green-700" :
                    item.type === "register" ? "bg-blue-100 text-blue-700" :
                    item.type === "add_book" ? "bg-purple-100 text-purple-700" :
                    "bg-muted text-muted-foreground"
                  }`}>
                    {item.type === "borrow" ? <BookMarked className="w-4 h-4" /> :
                     item.type === "return" ? <CheckCircle className="w-4 h-4" /> :
                     item.type === "register" ? <Users className="w-4 h-4" /> :
                     item.type === "add_book" ? <BookOpen className="w-4 h-4" /> :
                     <Clock className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.description}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{item.campus}</span>
                      <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Check Out Dialog */}
      <Dialog open={showBorrowDialog} onOpenChange={setShowBorrowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Check Out Physical Book</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleBorrow} className="space-y-4">
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input
                type="number"
                value={borrowForm.userId}
                onChange={(e) => setBorrowForm(f => ({ ...f, userId: e.target.value }))}
                placeholder="Enter user ID"
                required
              />
              <p className="text-xs text-muted-foreground">Check the Users tab for user IDs</p>
            </div>
            <div className="space-y-2">
              <Label>Book ID</Label>
              <Input
                type="number"
                value={borrowForm.bookId}
                onChange={(e) => setBorrowForm(f => ({ ...f, bookId: e.target.value }))}
                placeholder="Enter book ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={borrowForm.dueDate}
                onChange={(e) => setBorrowForm(f => ({ ...f, dueDate: e.target.value }))}
                required
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowBorrowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createBorrowMutation.isPending}>
                {createBorrowMutation.isPending ? "Processing..." : "Check Out"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

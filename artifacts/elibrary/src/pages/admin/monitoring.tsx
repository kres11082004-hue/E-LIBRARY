import { useState, useRef, useEffect, useCallback } from "react";
import { useGetMonitoringStats, useGetMonitoringByCourse, useGetRecentActivity, useListBorrowRecords, useCreateBorrowRecord, useUpdateBorrowRecord, useListUsers, getListBorrowRecordsQueryKey, getGetMonitoringStatsQueryKey, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, BookOpen, AlertTriangle, BookMarked, Building2, GraduationCap, Clock, Plus, CheckCircle, ChevronRight, X, Bell, QrCode, Camera, CameraOff, Mail, MessageSquare, ScanLine, RefreshCw } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { getCourseInfo, getDepartmentForCourse, COURSES_LIST } from "@/lib/department-utils";
import { Badge } from "@/components/ui/badge";


// ── QR / Barcode Scanner ────────────────────────────────────────────────────
function QrScanner({ onDetect, onClose }: { onDetect: (value: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let detector: any = null;
    const supported = "BarcodeDetector" in window;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanning(true);

        if (supported) {
          detector = new (window as any).BarcodeDetector({ formats: ["qr_code", "code_128", "ean_13", "ean_8", "code_39", "upc_a", "upc_e", "data_matrix"] });
        }

        const tick = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          if (detector) {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes.length > 0) {
                const val = codes[0].rawValue as string;
                setLastScan(val);
                onDetect(val);
                stopCamera();
                return;
              }
            } catch { /* ignore per-frame errors */ }
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch (err: any) {
        setError(err.message || "Camera access denied");
      }
    })();

    return () => { stopCamera(); };
  }, [onDetect, stopCamera]);

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] w-full">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-52 h-52 border-2 border-primary rounded-xl relative">
            <span className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-primary rounded-tl-lg" />
            <span className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-primary rounded-tr-lg" />
            <span className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-primary rounded-bl-lg" />
            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-primary rounded-br-lg" />
            {scanning && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary animate-[scan_2s_linear_infinite]" style={{ animation: "scan 2s linear infinite" }} />}
          </div>
        </div>
        {!scanning && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Camera className="w-8 h-8 text-white animate-pulse" />
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-2 p-4">
            <CameraOff className="w-8 h-8 text-red-400" />
            <p className="text-white text-xs text-center">{error}</p>
          </div>
        )}
      </div>
      {lastScan && (
        <p className="text-xs text-green-600 font-medium flex items-center gap-1">
          <CheckCircle className="w-3.5 h-3.5" /> Detected: <span className="font-mono">{lastScan}</span>
        </p>
      )}
      <p className="text-xs text-muted-foreground text-center">Point the camera at a book's ISBN barcode or a student ID QR code</p>
      <Button variant="outline" size="sm" className="w-full" onClick={onClose}>
        <X className="w-3.5 h-3.5 mr-1" /> Cancel Scan
      </Button>
    </div>
  );
}

// Scan animation keyframes injected once
const SCAN_STYLE = `.scan-line-anim { animation: scan 2s linear infinite; } @keyframes scan { 0%{top:0} 100%{top:100%} }`;
if (!document.getElementById("qr-scan-style")) {
  const s = document.createElement("style"); s.id = "qr-scan-style"; s.textContent = SCAN_STYLE; document.head.appendChild(s);
}
// ────────────────────────────────────────────────────────────────────────────

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
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [showScanner, setShowScanner] = useState<"userId" | "bookId" | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useGetMonitoringStats();
  const { data: byCourse = [] } = useGetMonitoringByCourse();
  const { data: activity = [] } = useGetRecentActivity();
  const { data: borrows = [] } = useListBorrowRecords();
  const { data: users = [] } = useListUsers();

  const { data: byDepartment = [] } = useQuery({
    queryKey: ["monitoring", "by-department"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/monitoring/by-department", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json() as Promise<any[]>;
    }
  });

  const { data: remindersData, refetch: refetchReminders, isFetching: isFetchingReminders } = useQuery({
    queryKey: ["notifications", "due-reminders"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/notifications/due-reminders", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return { total: 0, reminders: [] };
      return res.json() as Promise<{ total: number; reminders: any[] }>;
    },
    staleTime: 60_000,
  });
  const reminders = remindersData?.reminders ?? [];

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
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
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
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      toast({ title: "Book returned successfully" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const activeBorrows = borrows.filter(b => b.status === "borrowed");
  const overdueBorrows = borrows.filter(b => b.status === "overdue");

  // QR scan handler — auto-fill userId (numbers) or bookId
  const handleScan = useCallback((value: string) => {
    // Strip non-digits for numeric IDs
    const digits = value.replace(/\D/g, "");
    if (showScanner === "userId") {
      setBorrowForm(f => ({ ...f, userId: digits || value }));
      toast({ title: "User ID scanned", description: `ID: ${digits || value}` });
    } else if (showScanner === "bookId") {
      // ISBN can be numeric; also accept raw value
      setBorrowForm(f => ({ ...f, bookId: digits || value }));
      toast({ title: "Book / ISBN scanned", description: `Value: ${digits || value}` });
    }
    setShowScanner(null);
  }, [showScanner, toast]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Library Monitoring</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Physical library and user activity overview</p>
        </div>
        <div className="flex items-center gap-2">
          {reminders.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <Bell className="w-3 h-3" /> {reminders.length} reminder{reminders.length !== 1 ? "s" : ""}
            </Badge>
          )}
          <Button onClick={() => setShowBorrowDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Issue Book
          </Button>
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

      <Tabs defaultValue="department">
        <TabsList>
          <TabsTrigger value="department" className="gap-2"><Building2 className="w-3 h-3" /> By Department</TabsTrigger>
          <TabsTrigger value="course" className="gap-2"><GraduationCap className="w-3 h-3" /> By Course</TabsTrigger>
          <TabsTrigger value="borrows" className="gap-2"><BookMarked className="w-3 h-3" /> Borrow Records</TabsTrigger>
          <TabsTrigger value="activity" className="gap-2"><Clock className="w-3 h-3" /> Activity</TabsTrigger>
        </TabsList>

        {/* By Department */}
        <TabsContent value="department" className="space-y-4 mt-4">
          {byDepartment.length > 0 && (
            <div className="bg-card border rounded-xl p-4">
              <h3 className="font-semibold text-sm text-foreground mb-4">Students &amp; Active Borrows by Department</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byDepartment} margin={{ top: 0, right: 0, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="students" name="Students" fill="hsl(220,70%,45%)" radius={[4,4,0,0]} />
                  <Bar dataKey="instructors" name="Instructors" fill="hsl(150,60%,40%)" radius={[4,4,0,0]} />
                  <Bar dataKey="activeBorrows" name="Active Borrows" fill="hsl(40,85%,48%)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="bg-card border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b bg-muted/30">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase">Academic Department</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Students</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Instructors</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Total Users</th>
                  <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase">Active Borrows</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {byDepartment.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">No department data available</td></tr>
                ) : (
                  byDepartment.map((row: any) => (
                    <tr
                      key={row.department}
                      className="hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedDepartment(row)}
                    >
                      <td className="p-4 font-semibold text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          {row.department}
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      </td>
                      <td className="p-4 text-right text-sm">{row.students}</td>
                      <td className="p-4 text-right text-sm">{row.instructors}</td>
                      <td className="p-4 text-right text-sm font-medium">{row.totalUsers}</td>
                      <td className="p-4 text-right text-sm font-medium text-amber-600">{row.activeBorrows}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* By Course */}
        <TabsContent value="course" className="mt-4 space-y-6">
          {byCourse.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground text-sm">No student data yet</div>
          ) : (() => {
            // Build: { department → { year → row[] } }
            const byDept: Record<string, Record<string, typeof byCourse>> = {};
            byCourse.forEach((row) => {
              const dept = getCourseInfo(row.course).department;
              const yr   = row.year ? String(row.year) : "Unknown Year";
              if (!byDept[dept]) byDept[dept] = {};
              if (!byDept[dept][yr]) byDept[dept][yr] = [];
              byDept[dept][yr].push(row);
            });

            return Object.entries(byDept).map(([dept, yearMap]) => {
              const deptInfo = COURSES_LIST.find(c => c.department === dept);
              const allRows  = Object.values(yearMap).flat();
              const totalStudents = allRows.reduce((s, r) => s + (r.studentCount ?? 0), 0);
              const totalBorrows  = allRows.reduce((s, r) => s + (r.activeBorrows ?? 0), 0);

              return (
                <div key={dept} className="space-y-3">
                  {/* Department header */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={
                        deptInfo?.code === "BSIS" ? "bg-blue-50 text-blue-700 border-blue-200" :
                        deptInfo?.code === "BPED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-muted text-muted-foreground"
                      }>
                        {deptInfo?.code ?? "—"}
                      </Badge>
                      <h3 className="text-sm font-bold text-foreground">{dept}</h3>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span className="text-muted-foreground">Students: <strong className="text-foreground">{totalStudents}</strong></span>
                      <span className="text-muted-foreground">Active Borrows: <strong className="text-amber-600">{totalBorrows}</strong></span>
                    </div>
                  </div>

                  {/* Year level groups */}
                  <div className="space-y-2 pl-2 border-l-2 border-muted">
                    {Object.entries(yearMap)
                      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                      .map(([year, rows]) => {
                        const yearStudents = rows.reduce((s, r) => s + (r.studentCount ?? 0), 0);
                        const yearBorrows  = rows.reduce((s, r) => s + (r.activeBorrows ?? 0), 0);
                        return (
                          <div key={year} className="bg-card border rounded-xl overflow-hidden">
                            {/* Year level bar */}
                            <div className="px-4 py-2.5 bg-muted/40 border-b flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-xs font-bold text-foreground uppercase tracking-wide">{year}</span>
                              </div>
                              <div className="flex gap-3 text-xs">
                                <span className="text-muted-foreground">{yearStudents} students</span>
                                {yearBorrows > 0 && <span className="text-amber-600 font-medium">{yearBorrows} borrows</span>}
                              </div>
                            </div>
                            {/* Sections / Sets */}
                            <table className="w-full">
                              <thead className="border-b bg-muted/10">
                                <tr>
                                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Section / Set</th>
                                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Campus</th>
                                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Students</th>
                                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Active Borrows</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y">
                                {rows
                                  .slice()
                                  .sort((a, b) => (a.section || "").localeCompare(b.section || ""))
                                  .map((row, i) => (
                                    <tr key={i} className="hover:bg-muted/20">
                                      <td className="p-3 text-sm font-medium">Section {row.section || "—"}</td>
                                      <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{row.campus || "—"}</td>
                                      <td className="p-3 text-right text-sm">{row.studentCount}</td>
                                      <td className="p-3 text-right text-sm font-medium text-amber-600">{row.activeBorrows || 0}</td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            });
          })()}
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

      {/* Due-Date Reminders — standalone panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" /> Due-Date Reminders
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Books overdue or due within 3 days</p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetchReminders()} disabled={isFetchingReminders}>
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingReminders ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>

        {reminders.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center gap-3 bg-card border rounded-xl">
            <Bell className="w-10 h-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No upcoming due dates — all clear! 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((r: any) => {
              const dueStr = new Date(r.dueDate).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
              const urgencyColor =
                r.urgency === "overdue" ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800" :
                r.urgency === "due_today" ? "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800" :
                "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800";
              const badge =
                r.urgency === "overdue" ? <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Overdue {Math.abs(r.daysLeft)}d</Badge> :
                r.urgency === "due_today" ? <Badge className="bg-orange-500 text-[10px] px-1.5 py-0">Due Today</Badge> :
                <Badge className="bg-amber-500 text-[10px] px-1.5 py-0">Due in {r.daysLeft}d</Badge>;

              const emailSubject = encodeURIComponent(`Library Book Due Date Reminder — ${r.bookTitle}`);
              const emailBody = encodeURIComponent(`Dear ${r.userName},\n\nThis is a reminder that the book "${r.bookTitle}" is due on ${dueStr}.\n\nPlease return it to the library at your earliest convenience.\n\nZDSPGC E-Library`);
              const smsBody = encodeURIComponent(`[ZDSPGC Library] Hi ${r.userName.split(",")[1]?.trim() || r.userName}! Reminder: "${r.bookTitle}" is due ${r.urgency === "overdue" ? "OVERDUE" : `on ${dueStr}`}. Please return ASAP.`);

              return (
                <div key={r.borrowId} className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${urgencyColor}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {badge}
                      <span className="text-sm font-semibold text-foreground">{r.userName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">📖 {r.bookTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Due: {dueStr} · {r.userEmail}</p>
                    {r.userPhone && <p className="text-xs text-muted-foreground">📱 {r.userPhone}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={`mailto:${r.userEmail}?subject=${emailSubject}&body=${emailBody}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                        <Mail className="w-3.5 h-3.5" /> Email
                      </Button>
                    </a>
                    {r.userPhone && (
                      <a href={`sms:${r.userPhone}?body=${smsBody}`}>
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                          <MessageSquare className="w-3.5 h-3.5" /> SMS
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Department Detail Dialog */}
      <Dialog open={!!selectedDepartment} onOpenChange={(open) => !open && setSelectedDepartment(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              {selectedDepartment?.department}
            </DialogTitle>
            <div className="flex gap-4 pt-1">
              <span className="text-xs text-muted-foreground">Students: <strong>{selectedDepartment?.students}</strong></span>
              <span className="text-xs text-muted-foreground">Instructors: <strong>{selectedDepartment?.instructors}</strong></span>
              <span className="text-xs text-amber-600">Active Borrows: <strong>{selectedDepartment?.activeBorrows}</strong></span>
            </div>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 mt-2">
            {(() => {
              const deptUsers = users.filter((u: any) =>
                getDepartmentForCourse(u.course) === selectedDepartment?.department
              );
              const students = deptUsers.filter((u: any) => u.role === "student");
              const instructors = deptUsers.filter((u: any) => u.role === "instructor");

              const getUserBorrows = (userId: number) =>
                borrows.filter((b: any) => b.userId === userId || b.user?.id === userId);

              const renderBorrows = (userId: number) => {
                const userBorrows = getUserBorrows(userId);
                if (userBorrows.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
                return (
                  <div className="space-y-0.5">
                    {userBorrows.map((b: any) => (
                      <div key={b.id} className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-foreground line-clamp-1 max-w-[160px]">{b.book?.title || "Unknown"}</span>
                        <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${
                          b.status === "returned" ? "bg-green-100 text-green-700" :
                          b.status === "overdue"  ? "bg-red-100 text-red-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>{b.status}</span>
                      </div>
                    ))}
                  </div>
                );
              };

              return (
                <div className="space-y-4">
                  {students.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" /> Students ({students.length})
                      </p>
                      <div className="bg-card border rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="border-b bg-muted/30">
                            <tr>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">ID Number</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Course</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Books Borrowed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {students.map((u: any) => (
                              <tr key={u.id} className="hover:bg-muted/20 align-top">
                                <td className="p-3 text-sm font-medium">{u.fullname}</td>
                                <td className="p-3 text-sm text-muted-foreground font-mono">{u.schoolId || "—"}</td>
                                <td className="p-3 text-sm text-muted-foreground">{u.course || "—"}</td>
                                <td className="p-3">{renderBorrows(u.id)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {instructors.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Instructors ({instructors.length})
                      </p>
                      <div className="bg-card border rounded-xl overflow-hidden">
                        <table className="w-full">
                          <thead className="border-b bg-muted/30">
                            <tr>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Name</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Employee ID</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Campus</th>
                              <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Books Borrowed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {instructors.map((u: any) => (
                              <tr key={u.id} className="hover:bg-muted/20 align-top">
                                <td className="p-3 text-sm font-medium">{u.fullname}</td>
                                <td className="p-3 text-sm text-muted-foreground font-mono">{u.schoolId || "—"}</td>
                                <td className="p-3 text-sm text-muted-foreground">{u.campus || "—"}</td>
                                <td className="p-3">{renderBorrows(u.id)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {deptUsers.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      No users registered under this department yet.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* Check Out Dialog */}
      <Dialog open={showBorrowDialog} onOpenChange={(open) => { setShowBorrowDialog(open); if (!open) setShowScanner(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-primary" />
              Issue Physical Book
            </DialogTitle>
          </DialogHeader>

          {showScanner ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {showScanner === "userId" ? "Scan student/staff ID" : "Scan book barcode / ISBN"}
              </p>
              <QrScanner
                onDetect={handleScan}
                onClose={() => setShowScanner(null)}
              />
            </div>
          ) : (
            <form onSubmit={handleBorrow} className="space-y-4">
              <div className="space-y-2">
                <Label>User ID</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={borrowForm.userId}
                    onChange={(e) => setBorrowForm(f => ({ ...f, userId: e.target.value }))}
                    placeholder="Enter or scan user ID"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 h-10"
                    onClick={() => setShowScanner("userId")}
                    title="Scan student ID"
                  >
                    <ScanLine className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Scan student/staff QR ID or enter manually</p>
              </div>
              <div className="space-y-2">
                <Label>Book ID</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={borrowForm.bookId}
                    onChange={(e) => setBorrowForm(f => ({ ...f, bookId: e.target.value }))}
                    placeholder="Enter or scan book barcode"
                    required
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 h-10"
                    onClick={() => setShowScanner("bookId")}
                    title="Scan book ISBN barcode"
                  >
                    <ScanLine className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Scan book barcode/ISBN or enter Book ID manually</p>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useRef, useState, useMemo } from "react";
import { useGetMonitoringStats, useGetMonitoringByCampus, useGetMonitoringByCourse, useListBorrowRecords, useListUsers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, startOfMonth, isAfter, isBefore } from "date-fns";
import { Printer, FileText, Users, BookOpen, BookMarked, AlertTriangle, Building, GraduationCap, Search, CalendarIcon, Download } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="mb-8 print:mb-6">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-primary/30">
        <Icon className="w-4 h-4 text-primary print:text-black" />
        <h2 className="font-bold text-base text-foreground print:text-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`border rounded-lg p-4 text-center ${highlight ? "border-red-300 bg-red-50 print:border-red-400" : "bg-card print:border-gray-400"}`}>
      <p className={`text-2xl font-bold ${highlight ? "text-red-600" : "text-foreground"} print:text-black`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-xs text-muted-foreground print:text-gray-600 mt-0.5 uppercase tracking-wide font-medium">{label}</p>
    </div>
  );
}

type DateFilterType = "all" | "daily" | "weekly" | "monthly" | "custom";

export default function AdminReportsPage() {
  const reportRef = useRef<HTMLDivElement>(null);

  const { data: stats } = useGetMonitoringStats();
  const { data: byCampus = [] } = useGetMonitoringByCampus();
  const { data: byCourse = [] } = useGetMonitoringByCourse();
  const { data: allBorrows = [] } = useListBorrowRecords();
  const { data: allUsers = [] } = useListUsers();
  const { data: allDownloads = [] } = useQuery({
    queryKey: ["downloads", "all"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/downloads/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch downloads");
      return res.json() as Promise<any[]>;
    }
  });

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    if (dateFilterType === "daily") {
      return { startDate: today, endDate: today };
    }
    if (dateFilterType === "weekly") {
      return { startDate: startOfWeek(today), endDate: today };
    }
    if (dateFilterType === "monthly") {
      return { startDate: startOfMonth(today), endDate: today };
    }
    if (dateFilterType === "custom" && customDateRange?.from) {
      return { 
        startDate: customDateRange.from, 
        endDate: customDateRange.to || customDateRange.from
      };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateFilterType, customDateRange]);

  // Apply Filters
  const borrows = useMemo(() => {
    return allBorrows.filter(record => {
      // Status
      if (statusFilter !== "all" && record.status !== statusFilter) return false;
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const borrowerName = record.user?.fullname?.toLowerCase() || "";
        const bookTitle = record.book?.title?.toLowerCase() || "";
        if (!borrowerName.includes(query) && !bookTitle.includes(query)) return false;
      }
      // Date
      if (startDate && endDate) {
        const recordDate = new Date(record.borrowedAt);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (isBefore(recordDate, start) || isAfter(recordDate, end)) return false;
      }
      return true;
    });
  }, [allBorrows, statusFilter, searchQuery, startDate, endDate]);

  const groupedBorrows = useMemo(() => {
    const map = new Map<number, { user: any; records: any[] }>();
    borrows.forEach(record => {
      const userId = record.user?.id;
      if (!userId) return;
      if (!map.has(userId)) {
        map.set(userId, { user: record.user, records: [] });
      }
      map.get(userId)!.records.push(record);
    });
    return Array.from(map.values());
  }, [borrows]);

  const downloads = useMemo(() => {
    return allDownloads.filter(record => {
      // Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const borrowerName = record.user?.fullname?.toLowerCase() || "";
        const bookTitle = record.book?.title?.toLowerCase() || "";
        if (!borrowerName.includes(query) && !bookTitle.includes(query)) return false;
      }
      // Date
      if (startDate && endDate) {
        const recordDate = new Date(record.downloadedAt);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (isBefore(recordDate, start) || isAfter(recordDate, end)) return false;
      }
      return true;
    });
  }, [allDownloads, searchQuery, startDate, endDate]);

  const users = useMemo(() => {
     return allUsers.filter(u => {
        // Exclude admin and librarian roles from the report
        if (u.role === "admin" || u.role === "librarian") return false;

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return u.fullname.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
        }
        return true;
     });
  }, [allUsers, searchQuery]);

  const activeBorrows = borrows.filter(b => b.status === "borrowed");
  const returnedBorrows = borrows.filter(b => b.status === "returned");
  const overdueBorrows = borrows.filter(b => b.status === "overdue");
  const pendingUsers = users.filter(u => !u.isApproved);
  const approvedUsers = users.filter(u => u.isApproved);

  const now = new Date();
  const reportDate = now.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });
  const reportTime = now.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto print:max-w-none print:p-0">
      <BackButton className="print:hidden" />
      
      {/* Screen-only header */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Library Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Comprehensive library system report — printable</p>
        </div>
        <Button onClick={handlePrint} className="gap-2 shadow-md">
          <Printer className="w-4 h-4" />
          Print Report
        </Button>
      </div>

      {/* Filters (Screen only) */}
      <div className="bg-card border rounded-lg p-4 mb-6 print:hidden flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground">Search Records & Users</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, book title, email..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5 w-[160px]">
          <label className="text-xs font-medium text-muted-foreground">Borrow Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="borrowed">Borrowed</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 w-[160px]">
          <label className="text-xs font-medium text-muted-foreground">Date Range</label>
          <Select value={dateFilterType} onValueChange={(val: any) => setDateFilterType(val)}>
            <SelectTrigger>
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="daily">Today</SelectItem>
              <SelectItem value="weekly">This Week</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {dateFilterType === "custom" && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Custom Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !customDateRange?.from && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange?.from ? (
                    customDateRange.to ? (
                      <>
                        {format(customDateRange.from, "LLL dd, y")} - {format(customDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(customDateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={customDateRange?.from}
                  selected={customDateRange}
                  onSelect={(range: any) => setCustomDateRange(range)}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Printable report area */}
      <div ref={reportRef} className="bg-card border rounded-xl p-8 print:p-0 print:border-0 print:shadow-none print:rounded-none">

        {/* Report Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-primary/20 print:border-gray-300">
          <div className="flex items-center justify-center gap-3 mb-3 print:mb-2">
            <img src="/logo.jpg" alt="ZDSPGC Logo" className="w-14 h-14 rounded-full object-cover print:w-12 print:h-12" />
            <div className="text-left">
              <h1 className="text-xl font-bold text-primary print:text-black leading-tight">ZDSPGC E-Library System</h1>
              <p className="text-sm text-muted-foreground print:text-gray-600">Zamboanga del Sur Provincial Government College</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-lg font-semibold text-foreground print:text-black">Library Status Report</p>
            <p className="text-sm text-muted-foreground print:text-gray-600 mt-0.5">
              Generated on {reportDate} at {reportTime}
            </p>
            {(startDate || statusFilter !== "all" || searchQuery) && (
              <p className="text-xs text-primary font-medium mt-1 uppercase print:text-gray-700">
                [ Filtered Report ]
              </p>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        {stats && (
          <Section title="Summary Statistics" icon={BookOpen}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
              <StatBox label="Total Users" value={stats.totalUsers} />
              <StatBox label="Total Books" value={stats.totalBooks} />
              <StatBox label="Active Borrows" value={stats.activeBorrows} />
              <StatBox label="Overdue Books" value={stats.overdueBooks ?? 0} highlight={(stats.overdueBooks ?? 0) > 0} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 print:grid-cols-4">
              <StatBox label="Returned Books" value={returnedBorrows.length} />
              <StatBox label="Approved Users" value={approvedUsers.length} />
              <StatBox label="Pending Approval" value={pendingUsers.length} highlight={pendingUsers.length > 0} />
              <StatBox label="Total Transactions" value={borrows.length} />
            </div>
          </Section>
        )}

        {/* Borrow Records */}
        <Section title="Borrow Records" icon={BookMarked}>
          {borrows.length === 0 ? (
            <p className="text-sm text-muted-foreground print:text-gray-500 text-center py-4">No borrow records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-100">
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-12">#</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-48">Borrower</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-24">Campus</th>
                    <th className="text-center px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-24">Total Borrowed Books</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Book Title</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-36">ISBN</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-32">Borrow Date</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-32">Due Date</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-24">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedBorrows.map((group, i) => (
                    <tr key={group.user.id} className={i % 2 === 0 ? "bg-white print:bg-white" : "bg-muted/20 print:bg-gray-50"}>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground print:text-gray-500 align-top">{i + 1}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 font-medium align-top">{group.user.fullname ?? "—"}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground print:text-gray-600 text-xs align-top">{group.user.campus ?? "—"}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-center font-bold align-top">{group.records.length}</td>
                      
                      {/* Vertical Lists for Books */}
                      <td className="px-3 py-2 border border-border print:border-gray-300 align-top">
                        <div className="flex flex-col gap-1">
                          {group.records.map((record, idx) => (
                            <div key={idx} className="min-h-[24px] flex items-center whitespace-nowrap overflow-hidden text-ellipsis">{record.book?.title ?? "—"}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 align-top text-xs text-muted-foreground print:text-gray-600">
                        <div className="flex flex-col gap-1">
                          {group.records.map((record, idx) => (
                            <div key={idx} className="min-h-[24px] flex items-center">{record.book?.isbn ?? "—"}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 align-top text-xs text-muted-foreground print:text-gray-600">
                        <div className="flex flex-col gap-1">
                          {group.records.map((record, idx) => (
                            <div key={idx} className="min-h-[24px] flex items-center">{record.borrowedAt ? new Date(record.borrowedAt).toLocaleDateString("en-PH") : "—"}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 align-top text-xs text-muted-foreground print:text-gray-600">
                        <div className="flex flex-col gap-1">
                          {group.records.map((record, idx) => (
                            <div key={idx} className="min-h-[24px] flex items-center">{record.dueDate ? new Date(record.dueDate).toLocaleDateString("en-PH") : "—"}</div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 align-top">
                        <div className="flex flex-col gap-1">
                          {group.records.map((record, idx) => (
                            <div key={idx} className="min-h-[24px] flex items-center">
                              <span className={`text-xs font-semibold uppercase print:font-bold ${
                                record.status === "returned" ? "text-green-600 print:text-black" :
                                record.status === "overdue" ? "text-red-600 print:text-black" :
                                "text-amber-600 print:text-black"
                              }`}>
                                {record.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted/50 print:bg-gray-100 font-semibold">
                    <td colSpan={3} className="px-3 py-2 border border-border print:border-gray-300 text-sm text-right">Total Borrowers:</td>
                    <td className="px-3 py-2 border border-border print:border-gray-300 text-sm text-center">{groupedBorrows.length}</td>
                    <td colSpan={4} className="px-3 py-2 border border-border print:border-gray-300 text-sm text-right">Total Books:</td>
                    <td className="px-3 py-2 border border-border print:border-gray-300 text-sm">{borrows.length}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
          {/* Borrow summary mini stats */}
          {borrows.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center print:border-gray-400">
                <p className="text-lg font-bold text-amber-700 print:text-black">{activeBorrows.length}</p>
                <p className="text-xs text-amber-600 print:text-gray-600 font-medium uppercase">Currently Borrowed</p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center print:border-gray-400">
                <p className="text-lg font-bold text-green-700 print:text-black">{returnedBorrows.length}</p>
                <p className="text-xs text-green-600 print:text-gray-600 font-medium uppercase">Returned</p>
              </div>
              <div className={`border rounded-lg p-3 text-center print:border-gray-400 ${overdueBorrows.length > 0 ? "bg-red-50 border-red-200" : "bg-muted"}`}>
                <p className={`text-lg font-bold print:text-black ${overdueBorrows.length > 0 ? "text-red-700" : "text-muted-foreground"}`}>{overdueBorrows.length}</p>
                <p className={`text-xs font-medium uppercase print:text-gray-600 ${overdueBorrows.length > 0 ? "text-red-600" : "text-muted-foreground"}`}>Overdue</p>
              </div>
            </div>
          )}
        </Section>

        {/* Download Records */}
        <Section title="Download Records" icon={Download}>
          {downloads.length === 0 ? (
            <p className="text-sm text-muted-foreground print:text-gray-500 text-center py-4">No download records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-100">
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-12">#</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-48">User</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-24">Campus</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Book Title</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-36">ISBN</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide w-48">Download Date</th>
                  </tr>
                </thead>
                <tbody>
                  {downloads.map((record, i) => (
                    <tr key={record.id} className={i % 2 === 0 ? "bg-white print:bg-white" : "bg-muted/20 print:bg-gray-50"}>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground print:text-gray-500">{i + 1}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 font-medium">{record.user?.fullname ?? "—"}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground text-xs">{record.user?.campus ?? "—"}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300">{record.book?.title ?? "—"}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-xs font-mono text-muted-foreground">{record.book?.isbn ?? "—"}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-xs text-muted-foreground">
                        {new Date(record.downloadedAt).toLocaleString("en-PH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* By Campus */}
        {byCampus.length > 0 && (
          <Section title="Users by Campus" icon={Building}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-100">
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Campus</th>
                    <th className="text-right px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Students</th>
                    <th className="text-right px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Instructors</th>
                    <th className="text-right px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Active Borrows</th>
                  </tr>
                </thead>
                <tbody>
                  {byCampus.map((row, i) => (
                    <tr key={row.campus} className={i % 2 === 0 ? "bg-white print:bg-white" : "bg-muted/20 print:bg-gray-50"}>
                      <td className="px-3 py-2 border border-border print:border-gray-300 font-medium">{row.campus}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-right">{row.students}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-right">{row.instructors}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-right font-medium text-amber-600 print:text-black">{row.activeBorrows}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 print:bg-gray-100 font-semibold">
                    <td className="px-3 py-2 border border-border print:border-gray-300 text-sm">Total</td>
                    <td className="px-3 py-2 border border-border print:border-gray-300 text-right text-sm">{byCampus.reduce((s, r) => s + r.students, 0)}</td>
                    <td className="px-3 py-2 border border-border print:border-gray-300 text-right text-sm">{byCampus.reduce((s, r) => s + r.instructors, 0)}</td>
                    <td className="px-3 py-2 border border-border print:border-gray-300 text-right text-sm">{byCampus.reduce((s, r) => s + r.activeBorrows, 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* By Course */}
        {byCourse.length > 0 && (
          <Section title="Students by Course & Year Level" icon={GraduationCap}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-100">
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Course / Program</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Year & Section</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Campus</th>
                    <th className="text-right px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Students</th>
                    <th className="text-right px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Active Borrows</th>
                  </tr>
                </thead>
                <tbody>
                  {byCourse.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white print:bg-white" : "bg-muted/20 print:bg-gray-50"}>
                      <td className="px-3 py-2 border border-border print:border-gray-300 font-medium text-xs">{row.course}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground print:text-gray-600">{row.year} — Sec {row.section}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground print:text-gray-600 text-xs">{row.campus}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-right">{row.studentCount}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-right font-medium text-amber-600 print:text-black">{row.activeBorrows}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* Users List */}
        <Section title="Registered Users" icon={Users}>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No users found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/50 print:bg-gray-100">
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">#</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Full Name</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Email</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Role</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Campus</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Status</th>
                    <th className="text-left px-3 py-2 border border-border print:border-gray-300 text-xs font-semibold uppercase tracking-wide">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.id} className={i % 2 === 0 ? "bg-white print:bg-white" : "bg-muted/20 print:bg-gray-50"}>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 font-medium">{user.fullname}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground print:text-gray-600 text-xs">{user.email}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 capitalize text-xs">{user.role === "admin" || user.role === "librarian" ? "Admin/Librarian" : user.role}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground print:text-gray-600 text-xs">{user.campus}</td>
                      <td className="px-3 py-2 border border-border print:border-gray-300">
                        <span className={`text-xs font-semibold uppercase print:font-bold ${user.isApproved ? "text-green-600 print:text-black" : "text-amber-600 print:text-black"}`}>
                          {user.isApproved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-2 border border-border print:border-gray-300 text-muted-foreground print:text-gray-600 text-xs">
                        {new Date(user.createdAt).toLocaleDateString("en-PH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        {/* Print footer */}
        <div className="border-t border-border print:border-gray-300 pt-4 mt-6 text-center">
          <p className="text-xs text-muted-foreground print:text-gray-500">
            ZDSPGC E-Library System — Report generated on {reportDate} at {reportTime}
          </p>
          <p className="text-xs text-muted-foreground print:text-gray-500 mt-0.5">
            Zamboanga del Sur Provincial Government College — Library Management System
          </p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          @page {
            margin: 1.5cm;
            size: A4;
          }
          body * { visibility: hidden; }
          .print\\:p-0, .print\\:p-0 * { visibility: visible; }
          [ref] { position: absolute; left: 0; top: 0; width: 100%; }
          .print\\:hidden { display: none !important; }
          nav, aside, header { display: none !important; }
        }
      `}</style>
    </div>
  );
}

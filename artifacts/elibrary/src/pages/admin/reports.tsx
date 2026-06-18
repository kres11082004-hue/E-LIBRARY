import React, { useState, useMemo } from "react";
import { useGetBorrowingReport } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { Printer, FileSpreadsheet, FileText, Search, CalendarIcon, ChevronDown, ChevronUp, BookOpen, Users, Clock, CheckCircle2 } from "lucide-react";
import { BackButton } from "@/components/back-button";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

type DateFilterType = "all" | "daily" | "weekly" | "monthly" | "custom";

export default function AdminReportsPage() {
  const [roleTab, setRoleTab] = useState<string>("student");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const { startDate, endDate } = useMemo(() => {
    const today = new Date();
    if (dateFilterType === "daily") {
      return { startDate: format(today, "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
    }
    if (dateFilterType === "weekly") {
      return { startDate: format(startOfWeek(today), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
    }
    if (dateFilterType === "monthly") {
      return { startDate: format(startOfMonth(today), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
    }
    if (dateFilterType === "custom" && customDateRange?.from) {
      return { 
        startDate: format(customDateRange.from, "yyyy-MM-dd"), 
        endDate: customDateRange.to ? format(customDateRange.to, "yyyy-MM-dd") : format(customDateRange.from, "yyyy-MM-dd")
      };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateFilterType, customDateRange]);

  const { data: rawReportData, isLoading } = useGetBorrowingReport({
    role: roleTab,
    startDate,
    endDate,
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined
  });

  const reportData = rawReportData || [];

  const toggleRow = (userId: number) => {
    setExpandedRows(prev => ({ ...prev, [userId]: !prev[userId] }));
  };

  const stats = useMemo(() => {
    let totalBorrowers = reportData.length;
    let totalBooks = 0;
    let totalReturned = 0;
    let totalOverdue = 0;

    reportData.forEach((user: any) => {
      totalBooks += user.history?.length || 0;
      user.history?.forEach((book: any) => {
        if (book.status === "returned") totalReturned++;
        else if (book.status === "overdue") totalOverdue++;
      });
    });

    return { totalBorrowers, totalBooks, totalReturned, totalOverdue };
  }, [reportData]);

  const handleExcelExport = () => {
    const rows: any[] = [];
    reportData.forEach((user: any) => {
      user.history?.forEach((book: any) => {
        rows.push({
          "Borrower Name": user.fullname,
          "ID Number": user.studentNumber || "N/A",
          "Role": user.role,
          "Course/Dept": user.course || "N/A",
          "Book Title": book.title,
          "ISBN": book.isbn || "N/A",
          "Borrowed Date": format(new Date(book.borrowedAt), "PP"),
          "Due Date": format(new Date(book.dueDate), "PP"),
          "Returned Date": book.returnedAt ? format(new Date(book.returnedAt), "PP") : "Not Returned",
          "Status": book.status.toUpperCase()
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Borrowing_Report");
    XLSX.writeFile(workbook, `Borrowing_Report_${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  const handlePDFExport = () => {
    const doc = new jsPDF();
    doc.text(`Library Borrowing Report (${roleTab.toUpperCase()})`, 14, 15);
    
    const tableData: any[] = [];
    reportData.forEach((user: any) => {
      tableData.push([
        user.fullname, 
        user.studentNumber || "N/A", 
        user.course || "N/A", 
        user.totalBorrowed, 
        "---", "---", "---"
      ]);
      user.history?.forEach((book: any) => {
        tableData.push([
          "", "", "Book:", book.title, book.isbn || "N/A", 
          format(new Date(book.borrowedAt), "PP"), 
          book.status.toUpperCase()
        ]);
      });
    });

    autoTable(doc, {
      head: [["Name", "ID", "Course/Dept", "Total", "ISBN", "Borrowed Date", "Status"]],
      body: tableData,
      startY: 20,
      styles: { fontSize: 8 },
      theme: "grid"
    });

    doc.save(`Borrowing_Report_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl print:p-0">
      <div className="flex items-center gap-4 mb-6 print:hidden">
        <BackButton />
        <h1 className="text-3xl font-bold">Library Reports</h1>
      </div>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Unique Borrowers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalBorrowers}</div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Total Books Borrowed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">{stats.totalBooks}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" /> Total Returned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{stats.totalReturned}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-destructive" /> Total Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.totalOverdue}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={roleTab} onValueChange={setRoleTab} className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <TabsList className="print:hidden">
            <TabsTrigger value="student">Student Borrowing Report</TabsTrigger>
            <TabsTrigger value="instructor">Instructor Borrowing Report</TabsTrigger>
          </TabsList>

          <div className="flex gap-2 print:hidden w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handlePDFExport}>
              <FileText className="w-4 h-4 mr-2" /> Export PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExcelExport}>
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Export Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card border rounded-lg p-4 mb-6 print:hidden flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, ID, book title, ISBN..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5 w-[160px]">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
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

        {/* Grouped Table */}
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">Borrower Name</th>
                  <th className="px-6 py-4 font-medium">ID Number</th>
                  <th className="px-6 py-4 font-medium">{roleTab === "student" ? "Course" : "Department"}</th>
                  <th className="px-6 py-4 font-medium text-center">Total Books</th>
                  <th className="px-6 py-4 font-medium text-right print:hidden">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      Loading report data...
                    </td>
                  </tr>
                ) : reportData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No borrowing records found matching your filters.
                    </td>
                  </tr>
                ) : (
                  reportData.map((user: any) => (
                    <React.Fragment key={user.userId}>
                      <tr className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{user.fullname}</td>
                        <td className="px-6 py-4">{user.studentNumber || "-"}</td>
                        <td className="px-6 py-4">{user.course || "-"}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge variant="secondary" className="px-3 py-1 text-sm">{user.totalBorrowed}</Badge>
                        </td>
                        <td className="px-6 py-4 text-right print:hidden">
                          <Button variant="ghost" size="sm" onClick={() => toggleRow(user.userId)}>
                            {expandedRows[user.userId] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </td>
                      </tr>
                      {expandedRows[user.userId] && (
                        <tr className="bg-muted/10 print:table-row">
                          <td colSpan={5} className="px-6 py-4">
                            <div className="rounded-md border bg-card overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-muted text-xs uppercase">
                                  <tr>
                                    <th className="px-4 py-2">Book Title</th>
                                    <th className="px-4 py-2">ISBN</th>
                                    <th className="px-4 py-2">Borrowed Date</th>
                                    <th className="px-4 py-2">Due Date</th>
                                    <th className="px-4 py-2">Return Date</th>
                                    <th className="px-4 py-2">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y">
                                  {user.history?.map((book: any) => (
                                    <tr key={book.id}>
                                      <td className="px-4 py-3 font-medium">{book.title}</td>
                                      <td className="px-4 py-3 text-muted-foreground">{book.isbn || "-"}</td>
                                      <td className="px-4 py-3">{format(new Date(book.borrowedAt), "MMM d, yyyy")}</td>
                                      <td className="px-4 py-3">{format(new Date(book.dueDate), "MMM d, yyyy")}</td>
                                      <td className="px-4 py-3">{book.returnedAt ? format(new Date(book.returnedAt), "MMM d, yyyy") : "-"}</td>
                                      <td className="px-4 py-3">
                                        <Badge variant={book.status === "returned" ? "secondary" : book.status === "overdue" ? "destructive" : "default"}>
                                          {book.status}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Tabs>
      
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .container, .container * {
            visibility: visible;
          }
          .container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:table-row {
            display: table-row !important;
          }
        }
      `}</style>
    </div>
  );
}

import { Link } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useListBorrowRecords, useListReservations } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, Clock, AlertTriangle, BookMarked, ArrowLeftRight, CheckCircle2 } from "lucide-react";

export default function BorrowedPage() {
  const { user } = useAuth();
  const { data: borrowRecords = [], isLoading: isLoadingBorrows } = useListBorrowRecords({ userId: user?.id });
  const { data: reservations = [], isLoading: isLoadingReservations } = useListReservations();
  const isLoading = isLoadingBorrows || isLoadingReservations;

  // Filter reservations for current user
  const myReservations = reservations.filter(r => r.userId === user?.id);

  // Combine reservations and borrow records
  const records = [
    ...borrowRecords,
    ...myReservations.filter(r => r.status === "pending" || r.status === "ready").map(r => ({
      id: `res-${r.id}`,
      book: {
        id: r.bookId,
        title: r.bookTitle,
        coverUrl: r.bookCoverUrl,
        author: "Unknown", // API might not have author in reservation
        category: "Unknown",
        campus: r.bookCampus,
      },
      borrowedAt: null,
      returnedAt: null,
      dueDate: null,
      status: r.status === "pending" ? "pending approval" : "approved (pickup)",
    }))
  ];

  // Format date and time helper
  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return { date: "—", time: "—", full: "—" };
    const dateObj = new Date(isoString);
    const date = dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const time = dateObj.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { date, time, full: `${date} at ${time}` };
  };

  // Helper to calculate days remaining or overdue
  const getDueStatus = (dueDateStr?: string, status?: string) => {
    if (!dueDateStr || status === "returned") return null;
    const now = new Date();
    const due = new Date(dueDateStr);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? "day" : "days"}`,
        isOverdue: true,
      };
    } else if (diffDays === 0) {
      return { text: "Due today", isOverdue: true };
    } else {
      return {
        text: `${diffDays} ${diffDays === 1 ? "day" : "days"} left`,
        isOverdue: false,
      };
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-muted rounded w-48" />
        <div className="h-4 bg-muted rounded w-80" />
        <div className="h-10 bg-muted rounded w-full mt-6" />
        <div className="grid gap-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-xl p-5 h-36" />
          ))}
        </div>
      </div>
    );
  }

  const activeBorrows = records.filter((r) => r.status === "borrowed" || r.status === "pending approval" || r.status === "approved (pickup)");
  const overdueBorrows = records.filter((r) => r.status === "overdue" || (r.status === "borrowed" && getDueStatus(r.dueDate, r.status)?.isOverdue));
  const returnedBorrows = records.filter((r) => r.status === "returned");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Borrowed Books</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Monitor your active and historical physical library book check-outs
        </p>
      </div>

      {/* Warning Alert for Overdue Books */}
      {overdueBorrows.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-sm">Overdue Return Warning</h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              You have {overdueBorrows.length} {overdueBorrows.length === 1 ? "book" : "books"} past the return due date. Please return {overdueBorrows.length === 1 ? "it" : "them"} to the library counter as soon as possible to avoid account limitations or overdue penalties.
            </p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-card-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Borrows</p>
              <p className="text-2xl font-bold text-foreground mt-1">{activeBorrows.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-card-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Overdue</p>
              <p className={`text-2xl font-bold mt-1 ${overdueBorrows.length > 0 ? "text-destructive" : "text-foreground"}`}>
                {overdueBorrows.length}
              </p>
            </div>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${overdueBorrows.length > 0 ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-card-border bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Returned</p>
              <p className="text-2xl font-bold text-foreground mt-1">{returnedBorrows.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Filter Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All Records ({records.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            Active Borrows ({activeBorrows.length + overdueBorrows.length})
          </TabsTrigger>
          <TabsTrigger value="returned" className="gap-2">
            Returned ({returnedBorrows.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <BorrowList records={records} getDueStatus={getDueStatus} formatDateTime={formatDateTime} />
        </TabsContent>

        <TabsContent value="active" className="mt-0">
          <BorrowList 
            records={[...overdueBorrows, ...activeBorrows.filter(r => !overdueBorrows.some(o => o.id === r.id))]} 
            getDueStatus={getDueStatus} 
            formatDateTime={formatDateTime} 
          />
        </TabsContent>

        <TabsContent value="returned" className="mt-0">
          <BorrowList records={returnedBorrows} getDueStatus={getDueStatus} formatDateTime={formatDateTime} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface BorrowListProps {
  records: any[];
  getDueStatus: (dueDateStr?: string, status?: string) => { text: string; isOverdue: boolean } | null;
  formatDateTime: (isoString?: string | null) => { date: string; time: string; full: string };
}

function BorrowList({ records, getDueStatus, formatDateTime }: BorrowListProps) {
  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-card border border-dashed border-card-border rounded-xl text-center">
        <ArrowLeftRight className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <h3 className="font-semibold text-foreground text-sm">No borrow records found</h3>
        <p className="text-muted-foreground text-xs mt-1 max-w-sm">
          Any books checked out from the physical library will appear here for tracking.
        </p>
        <Link href="/books">
          <Button size="sm" variant="outline" className="mt-4 gap-2">
            Browse Books
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {records.map((record) => {
        const borrowed = formatDateTime(record.borrowedAt);
        const returned = formatDateTime(record.returnedAt);
        const due = formatDateTime(record.dueDate);
        const dueStatus = getDueStatus(record.dueDate, record.status);
        const isOverdue = record.status === "overdue" || !!dueStatus?.isOverdue;

        return (
          <div
            key={record.id}
            className={`bg-card border rounded-xl p-5 hover:shadow-sm transition-all flex flex-col md:flex-row gap-5 justify-between items-start md:items-center ${
              isOverdue ? "border-destructive/30 bg-destructive/5" : "border-card-border"
            }`}
          >
            {/* Book Details */}
            <div className="flex gap-4 items-start min-w-0">
              <div className="w-12 h-16 bg-muted border rounded overflow-hidden shrink-0 flex items-center justify-center">
                {record.book?.coverUrl ? (
                  <img
                    src={record.book.coverUrl}
                    alt={record.book.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="min-w-0 space-y-0.5">
                <h4 className="font-semibold text-sm text-foreground line-clamp-1 leading-snug">
                  {record.book?.title}
                </h4>
                <p className="text-xs text-muted-foreground">{record.book?.author}</p>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px] text-muted-foreground">
                  <span className="px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded">
                    {record.book?.category}
                  </span>
                  <span>•</span>
                  <span>{record.book?.campus}</span>
                </div>
              </div>
            </div>

            {/* Time stamps */}
            <div className="grid grid-cols-2 md:flex md:items-center gap-x-6 gap-y-2 text-xs shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-0 border-dashed border-card-border">
              {/* Date Borrowed */}
              <div className="space-y-0.5">
                <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" /> {record.status === "pending approval" ? "Requested" : "Borrowed"}
                </p>
                <p className="font-semibold text-foreground">{borrowed.date}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground/60" /> {borrowed.time}
                </p>
              </div>

              {/* Date Returned or Due Date */}
              {record.status === "returned" ? (
                <div className="space-y-0.5">
                  <p className="text-green-600 font-medium text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Returned
                  </p>
                  <p className="font-semibold text-green-700">{returned.date}</p>
                  <p className="text-[11px] text-green-600/80 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {returned.time}
                  </p>
                </div>
              ) : record.status === "pending approval" || record.status === "approved (pickup)" ? (
                <div className="space-y-0.5">
                  <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-600" /> Status
                  </p>
                  <p className="font-semibold text-foreground">
                    Awaiting Action
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-600" /> Return Due
                  </p>
                  <p className={`font-semibold ${isOverdue ? "text-destructive" : "text-foreground"}`}>
                    {due.date}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    by 11:59 PM
                  </p>
                </div>
              )}
            </div>

            {/* Badges / Alerts */}
            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center w-full md:w-28 shrink-0 pt-2 md:pt-0">
              <span className="md:hidden text-xs text-muted-foreground">Status</span>
              <div className="space-y-1 text-right">
                <Badge
                  variant={
                    record.status === "returned"
                      ? "secondary"
                      : isOverdue
                      ? "destructive"
                      : "secondary"
                  }
                  className={`capitalize font-semibold text-[11px] ${
                    record.status === "returned"
                      ? "bg-green-100 text-green-700 hover:bg-green-200 border-transparent dark:bg-green-950 dark:text-green-300"
                      : record.status === "pending approval"
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent dark:bg-amber-950 dark:text-amber-300"
                      : record.status === "approved (pickup)"
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border-transparent dark:bg-blue-950 dark:text-blue-300"
                      : !isOverdue
                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border-transparent dark:bg-amber-950 dark:text-amber-300"
                      : ""
                  }`}
                >
                  {isOverdue ? "overdue" : record.status}
                </Badge>
                {dueStatus && (
                  <p
                    className={`text-[10px] font-medium block ${
                      dueStatus.isOverdue ? "text-destructive" : "text-amber-600"
                    }`}
                  >
                    {dueStatus.text}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useListReservations, useUpdateReservation, useDeleteReservation, getListReservationsQueryKey, useCreateBorrowRecord } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/back-button";
import {
  CalendarCheck, Clock, CheckCircle, XCircle, BookOpen, User, Search, Filter, CheckCircle2,
} from "lucide-react";

type ReservationStatus = "pending" | "ready" | "fulfilled" | "cancelled" | "returned";

const STATUS_BADGE: Record<ReservationStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; Icon: React.ElementType }> = {
  pending:   { label: "Pending",   variant: "secondary",   Icon: Clock },
  ready:     { label: "Ready",     variant: "default",     Icon: CheckCircle },
  fulfilled: { label: "Fulfilled", variant: "outline",     Icon: CalendarCheck },
  cancelled: { label: "Cancelled", variant: "destructive", Icon: XCircle },
  returned:  { label: "Returned",  variant: "outline",     Icon: CheckCircle2 },
};

const NEXT_STATUS: Partial<Record<ReservationStatus, ReservationStatus>> = {
  pending:  "ready",
  ready:    "fulfilled",
  fulfilled: "returned",
};

const NEXT_LABEL: Partial<Record<ReservationStatus, string>> = {
  pending: "Mark Ready",
  ready:   "Confirm",
  fulfilled: "Mark Returned",
};

export default function AdminReservationsPage() {
  const { data: reservations = [], isLoading } = useListReservations();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateMutation = useUpdateReservation();
  const cancelMutation = useDeleteReservation();
  const createBorrowMutation = useCreateBorrowRecord();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReservationStatus>("all");
  
  const [fulfillingReservation, setFulfillingReservation] = useState<any>(null);
  const [dueDate, setDueDate] = useState("");

  const filtered = reservations.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.bookTitle.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAdvance = async (r: any, nextStatus: ReservationStatus) => {
    if (nextStatus === "fulfilled") {
      try {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        await createBorrowMutation.mutateAsync({
          data: {
            userId: r.userId,
            bookId: r.bookId,
            dueDate: nextWeek.toISOString(),
          },
        });
        await updateMutation.mutateAsync({ id: r.id, data: { status: "fulfilled" } });
        toast({ title: "Reservation confirmed and book checked out!" });
        queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
      } catch (err: any) {
        toast({ title: err?.data?.error || "Failed to confirm reservation", variant: "destructive" });
      }
      return;
    }

    try {
      await updateMutation.mutateAsync({ id: r.id, data: { status: nextStatus } });
      toast({ title: `Reservation marked as "${nextStatus}"` });
      queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelMutation.mutateAsync({ id });
      toast({ title: "Reservation cancelled" });
      queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
    } catch {
      toast({ title: "Failed to cancel", variant: "destructive" });
    }
  };

  const counts = {
    pending:   reservations.filter(r => r.status === "pending").length,
    ready:     reservations.filter(r => r.status === "ready").length,
    fulfilled: reservations.filter(r => r.status === "fulfilled").length,
    returned:  reservations.filter(r => r.status === "returned").length,
    cancelled: reservations.filter(r => r.status === "cancelled").length,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reservations</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage physical book reservation requests from students and faculty.</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["pending", "ready", "fulfilled", "returned", "cancelled"] as const).map(s => {
          const { label, Icon } = STATUS_BADGE[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`bg-card border rounded-xl p-3 text-left transition-colors hover:bg-muted/50 ${statusFilter === s ? "ring-2 ring-primary" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-bold">{counts[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by book title or user name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
          <SelectTrigger className="w-40 gap-2">
            <Filter className="w-4 h-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted rounded-xl h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <CalendarCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="font-semibold text-foreground">No reservations found</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {search || statusFilter !== "all" ? "Try adjusting your filters." : "Reservation requests will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => {
            const badgeCfg = STATUS_BADGE[r.status as ReservationStatus] ?? STATUS_BADGE.pending;
            const nextStatus = NEXT_STATUS[r.status as ReservationStatus];
            const nextLabel = NEXT_LABEL[r.status as ReservationStatus];
            const canCancel = r.status === "pending" || r.status === "ready";

            return (
              <div key={r.id} className="bg-card border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Book cover placeholder */}
                <div className="w-12 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                  {r.bookCoverUrl
                    ? <img src={r.bookCoverUrl} alt={r.bookTitle} className="w-full h-full object-cover" />
                    : <BookOpen className="w-5 h-5 text-muted-foreground/40" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-foreground truncate">{r.bookTitle}</h3>
                    <Badge variant={badgeCfg.variant} className="gap-1 text-xs shrink-0">
                      <badgeCfg.Icon className="w-3 h-3" />
                      {badgeCfg.label}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.userName}</span>
                    <span>{r.userEmail}</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{r.bookCampus}</span>
                    <span>{new Date(r.reservedAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                  {r.notes && (
                    <p className="text-xs text-muted-foreground mt-1 italic">"{r.notes}"</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0 flex-wrap">
                  {nextStatus && nextLabel && (
                    <Button
                      size="sm"
                      className="gap-1.5"
                      onClick={() => handleAdvance(r, nextStatus as ReservationStatus)}
                      disabled={updateMutation.isPending}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {nextLabel}
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-destructive hover:text-destructive hover:border-destructive/50"
                      onClick={() => handleCancel(r.id)}
                      disabled={cancelMutation.isPending}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

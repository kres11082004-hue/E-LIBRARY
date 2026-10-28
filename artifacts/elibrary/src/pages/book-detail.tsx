import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import {
  useGetBook,
  useAddToMyList,
  useRemoveFromMyList,
  useGetMyList,
  useListReservations,
  useCreateReservation,
  useDeleteReservation,
  getGetMyListQueryKey,
  getListReservationsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  BookOpen, ArrowLeft, BookMarked, BookmarkX, Calendar, Hash,
  Building, BookText, Clock, CheckCircle, XCircle, CalendarCheck, Download, Camera,
} from "lucide-react";
import { triggerBookDownload } from "@/lib/download-helper";

// ── Time slot options (library operating hours) ──────────────────────────────
const TIME_SLOTS = [
  "07:00 AM", "07:30 AM",
  "08:00 AM", "08:30 AM",
  "09:00 AM", "09:30 AM",
  "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM",
  "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM",
  "05:00 PM",
];

export default function BookDetailPage() {
  const [, params] = useRoute("/books/:id");
  const id = parseInt(params?.id || "0");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: book, isLoading } = useGetBook(id, { query: { enabled: !!id } as any });
  const { data: myList = [] } = useGetMyList();
  const { data: reservations = [] } = useListReservations();
  const addMutation = useAddToMyList();
  const removeMutation = useRemoveFromMyList();
  const createReservation = useCreateReservation();
  const cancelReservation = useDeleteReservation();

  const [imgError, setImgError] = useState(false);

  // Reservation scheduling dialog state
  const [showReserveDialog, setShowReserveDialog] = useState(false);
  const [visitDate, setVisitDate] = useState(() => {
    return new Date().toISOString().split("T")[0]; // default: today
  });
  const [visitTime, setVisitTime] = useState("09:00 AM");
  const [notes, setNotes] = useState("");

  const inMyList = myList.some(item => item.bookId === id);

  // Find user's reservation for this book
  const myReservation = reservations.find(
    r => r.bookId === id && r.userId === user?.id
  );

  const getReservationStatus = () => {
    if (!myReservation) return null;
    switch (myReservation.status) {
      case "pending":
        return { label: "Visit Request Pending", color: "text-amber-600 border-amber-200 bg-amber-50", Icon: Clock };
      case "ready":
        return { label: "Approved — Ready for Visit", color: "text-blue-600 border-blue-200 bg-blue-50", Icon: CheckCircle };
      case "fulfilled":
        return { label: "Visit Completed", color: "text-green-600 border-green-200 bg-green-50", Icon: CheckCircle };
      case "cancelled":
        return { label: "Request Cancelled", color: "text-muted-foreground bg-muted border-border", Icon: XCircle };
      default:
        return null;
    }
  };

  const reservationStatus = getReservationStatus();
  const hasActiveReservation = myReservation && (myReservation.status === "pending" || myReservation.status === "ready");

  // Minimum date: today (students may visit same-day)
  const minDate = new Date().toISOString().split("T")[0];

  const handleToggleList = async () => {
    try {
      if (inMyList) {
        await removeMutation.mutateAsync({ bookId: id });
        toast({ title: "Removed from your list" });
      } else {
        await addMutation.mutateAsync({ data: { bookId: id } });
        toast({ title: "Saved to your reading list" });
      }
      queryClient.invalidateQueries({ queryKey: getGetMyListQueryKey() });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleReserveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReservation.mutateAsync({
        data: {
          bookId: id,
          notes: notes || undefined,
          visitDate,
          visitTime,
        } as any,
      });
      toast({
        title: "Visit request submitted!",
        description: `Scheduled for ${new Date(visitDate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })} at ${visitTime}.`,
      });
      queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
      setShowReserveDialog(false);
      setNotes("");
    } catch (err: any) {
      toast({ title: err?.data?.error || "Could not submit request", variant: "destructive" });
    }
  };

  const handleCancelReservation = async () => {
    if (!myReservation) return;
    try {
      await cancelReservation.mutateAsync({ id: myReservation.id });
      toast({ title: "Visit request cancelled" });
      queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
    } catch {
      toast({ title: "Could not cancel request", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto animate-pulse space-y-6">
        <div className="h-6 bg-muted rounded w-32" />
        <div className="flex gap-8">
          <div className="w-48 h-64 bg-muted rounded-xl shrink-0" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-24 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-6 text-center py-20">
        <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="font-semibold text-foreground">Book not found</h2>
        <Link href="/books"><Button variant="outline" className="mt-4">Back to Library</Button></Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Link href="/books">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </button>
      </Link>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover */}
        <div className="shrink-0">
          <div
            className="w-full md:w-48 h-64 bg-muted rounded-xl overflow-hidden shadow-md cursor-pointer group relative"
            onClick={() => setLocation(`/books/${id}/read`)}
          >
            {book.coverUrl && !imgError ? (
              <img
                src={book.coverUrl}
                alt={book.title}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-4 text-center text-white relative">
                <BookOpen className="w-10 h-10 opacity-40 mb-2" />
                <span className="text-sm font-bold line-clamp-3 leading-tight">{book.title}</span>
                <span className="text-xs text-slate-300 mt-2 opacity-80">{book.category}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-primary/80 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
              <BookText className="w-8 h-8 text-white" />
              <span className="text-white text-sm font-semibold">Read Now</span>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button className="w-full gap-2" onClick={() => setLocation(`/books/${id}/read`)}>
              <BookText className="w-4 h-4" />
              {book.fileUrl ? "Read Now" : "Open Book"}
            </Button>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                if (!user?.id) return;
                triggerBookDownload(user.id, book);
                toast({ title: "Download Started", description: "Saving book for offline reading." });
              }}
            >
              <Download className="w-4 h-4" /> Download Book
            </Button>

            <Button
              onClick={handleToggleList}
              variant={inMyList ? "secondary" : "outline"}
              className="w-full gap-2"
              disabled={addMutation.isPending || removeMutation.isPending}
            >
              {inMyList
                ? <><BookmarkX className="w-4 h-4" /> Remove from List</>
                : <><BookMarked className="w-4 h-4" /> Save to My List</>}
            </Button>
          </div>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-4">
          <div>
            <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{book.category}</span>
            <h1 className="text-2xl font-bold text-foreground mt-3 leading-tight">{book.title}</h1>
            <p className="text-lg text-muted-foreground mt-1">{book.author}</p>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${book.fileUrl ? "bg-green-50 text-green-700 border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
            <div className={`w-2 h-2 rounded-full ${book.fileUrl ? "bg-green-500" : "bg-amber-400"}`} />
            {book.fileUrl ? "Digital copy available — read online" : "No digital copy — physical only"}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {book.publishedYear && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>{book.publishedYear}</span>
              </div>
            )}
            {book.isbn && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Hash className="w-4 h-4" />
                <span className="font-mono text-xs">{book.isbn}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="w-4 h-4" />
              <span>{book.campus}</span>
            </div>
          </div>

          <div className="bg-muted/50 rounded-xl p-4">
            <h3 className="font-semibold text-sm text-foreground mb-2">Description</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{book.description}</p>
          </div>

          {/* Physical Availability + Visit Request */}
          {book.isAvailablePhysical && (
            <div className="bg-card border rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-sm text-foreground">Physical Copy — Library Visit</h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{book.availableCopies ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
                <div className="text-muted-foreground">/</div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{book.totalCopies ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Total Copies</p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.round(((book.availableCopies ?? 0) / Math.max(book.totalCopies ?? 1, 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(book.availableCopies ?? 0) > 0 ? "Available for visit" : "All copies currently in use"}
                  </p>
                </div>
              </div>

              {/* Current reservation status */}
              {reservationStatus && (
                <div className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${reservationStatus.color}`}>
                  <reservationStatus.Icon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{reservationStatus.label}</p>
                    {myReservation?.status === "pending" && (myReservation as any).visitDate && (
                      <p className="text-xs mt-0.5 opacity-80">
                        Scheduled: {new Date((myReservation as any).visitDate).toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}
                        {" "}at {(myReservation as any).visitTime}
                      </p>
                    )}
                    {myReservation?.status === "ready" && (
                      <p className="text-xs mt-0.5 font-medium">Please visit the library at your scheduled time</p>
                    )}
                    {myReservation?.status === "pending" && (
                      <p className="text-xs mt-0.5 opacity-70">Waiting for librarian approval</p>
                    )}
                  </div>
                </div>
              )}

              {user?.role !== "admin" && user?.role !== "librarian" && (
                <>
                  {hasActiveReservation ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2 text-destructive hover:text-destructive hover:border-destructive/50"
                      onClick={handleCancelReservation}
                      disabled={cancelReservation.isPending}
                    >
                      <XCircle className="w-4 h-4" />
                      Cancel Visit Request
                    </Button>
                  ) : myReservation?.status !== "fulfilled" && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-primary text-primary hover:bg-primary/5"
                      onClick={() => setShowReserveDialog(true)}
                    >
                      <CalendarCheck className="w-4 h-4" />
                      Schedule a Library Visit
                    </Button>
                  )}
                </>
              )}

              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Camera className="w-3 h-3" />
                Visit {book.campus} library at your scheduled time to view and take pictures of this book.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Reserve / Schedule Visit Dialog ───────────────────────────────── */}
      <Dialog open={showReserveDialog} onOpenChange={setShowReserveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              Schedule Library Visit
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReserveSubmit} className="space-y-5">
            {/* Book reminder */}
            <div className="flex items-center gap-3 bg-muted/40 rounded-xl p-3">
              {book.coverUrl && (
                <img src={book.coverUrl} alt={book.title} className="w-10 h-14 object-cover rounded-lg shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{book.title}</p>
                <p className="text-xs text-muted-foreground">{book.author}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{book.campus}</p>
              </div>
            </div>

            {/* Visit purpose note */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
              <Camera className="w-4 h-4 shrink-0 mt-0.5" />
              <p>You are scheduling a <strong>library visit</strong> to view and take pictures of this book. Choose a convenient date and time below.</p>
            </div>

            {/* Visit Date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                <Calendar className="w-4 h-4 text-primary" />
                Visit Date <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                min={minDate}
                required
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">Select the date you plan to visit the library.</p>
            </div>

            {/* Visit Time */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Preferred Time <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setVisitTime(slot)}
                    className={`text-xs font-medium py-2 px-1 rounded-lg border transition-all ${
                      visitTime === slot
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-background border-border hover:border-primary/50 hover:bg-primary/5"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Selected: <strong>{visitTime}</strong></p>
            </div>

            {/* Optional note */}
            <div className="space-y-2">
              <Label className="font-semibold text-sm">Additional Note <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="e.g. I need to check Chapter 3 for my thesis..."
                rows={2}
                className="w-full text-sm border border-border rounded-lg px-3 py-2 resize-none bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowReserveDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={createReservation.isPending}>
                <CalendarCheck className="w-4 h-4" />
                {createReservation.isPending ? "Submitting..." : "Confirm Visit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import {
  BookOpen, ArrowLeft, BookMarked, BookmarkX, Calendar, Hash,
  Building, BookText, Clock, CheckCircle, XCircle, CalendarCheck, Download,
} from "lucide-react";
import { triggerBookDownload } from "@/lib/download-helper";

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

  const inMyList = myList.some(item => item.bookId === id);

  // Find user's reservation for this book
  const myReservation = reservations.find(
    r => r.bookId === id && r.userId === user?.id
  );
  
  const getReservationStatus = () => {
    if (!myReservation) return null;
    switch (myReservation.status) {
      case "pending":
        return { label: "Borrow Request Pending", color: "text-amber-600 border-amber-200 bg-amber-50", Icon: Clock };
      case "ready":
        return { label: "Approved for Pickup", color: "text-blue-600 border-blue-200 bg-blue-50", Icon: CheckCircle };
      case "fulfilled":
        return { label: "Currently Borrowed", color: "text-green-600 border-green-200 bg-green-50", Icon: CheckCircle };
      case "cancelled":
        return { label: "Request Cancelled", color: "text-muted-foreground bg-muted border-border", Icon: XCircle };
      default:
        return null;
    }
  };

  const reservationStatus = getReservationStatus();
  const hasActiveReservation = myReservation && (myReservation.status === "pending" || myReservation.status === "ready");

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

  const handleReserve = async () => {
    try {
      await createReservation.mutateAsync({ data: { bookId: id } });
      toast({ title: "Borrow request submitted!", description: "Check status in your profile." });
      queryClient.invalidateQueries({ queryKey: getListReservationsQueryKey() });
    } catch (err: any) {
      toast({ title: err?.data?.error || "Could not request book", variant: "destructive" });
    }
  };

  const handleCancelReservation = async () => {
    if (!myReservation) return;
    try {
      await cancelReservation.mutateAsync({ id: myReservation.id });
      toast({ title: "Borrow request cancelled" });
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
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <BookOpen className="w-10 h-10 opacity-30" />
                <span className="text-xs text-center px-4">{book.category}</span>
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

          {/* Physical Availability + Borrow Request */}
          {book.isAvailablePhysical && (
            <div className="bg-card border rounded-xl p-4 space-y-4">
              <h3 className="font-semibold text-sm text-foreground">Physical Copy Availability</h3>

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
                    {(book.availableCopies ?? 0) > 0 ? "Available for borrowing" : "All copies are currently borrowed"}
                  </p>
                </div>
              </div>

              {reservationStatus && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${reservationStatus.color}`}>
                  <reservationStatus.Icon className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-semibold">{reservationStatus.label}</p>
                    {myReservation?.status === "ready" && (
                      <p className="text-xs mt-0.5 font-medium">Please pick up from the library counter</p>
                    )}
                    {myReservation?.status === "pending" && (
                      <p className="text-xs mt-0.5 opacity-80">Waiting for librarian approval</p>
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
                      Cancel Borrow Request
                    </Button>
                  ) : myReservation?.status !== "fulfilled" && (
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-primary text-primary hover:bg-primary/5"
                      onClick={handleReserve}
                      disabled={createReservation.isPending}
                    >
                      <CalendarCheck className="w-4 h-4" />
                      Reserve a Physical Copy
                    </Button>
                  )}
                </>
              )}

              <p className="text-xs text-muted-foreground">Visit {book.campus} library to borrow or collect reserved copies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

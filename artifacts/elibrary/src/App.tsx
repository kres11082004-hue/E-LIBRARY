import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/layout";
import { OfflineBanner } from "@/components/offline-banner";
import { PwaUpdatePrompt } from "@/components/pwa-update-prompt";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import HomePage from "@/pages/home";
import BooksPage from "@/pages/books";
import BookDetailPage from "@/pages/book-detail";
import MyListPage from "@/pages/my-list";
import BorrowedPage from "@/pages/borrowed";
import ProfilePage from "@/pages/profile";
import AdminBooksPage from "@/pages/admin/books";
import AdminUsersPage from "@/pages/admin/users";
import AdminMonitoringPage from "@/pages/admin/monitoring";
import AdminReservationsPage from "@/pages/admin/reservations";
import AdminReportsPage from "@/pages/admin/reports";
import AdminDashboardPage from "@/pages/admin/dashboard";
import AdminAuthorizedUsersPage from "@/pages/admin/authorized-users";
import ReadPage from "@/pages/read";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({
  component: Component,
  adminOnly = false,
}: {
  component: React.ComponentType;
  adminOnly?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  if (!user) return <Redirect to="/login" />;
  if (adminOnly && user.role !== "admin" && user.role !== "librarian")  // keep librarian for legacy seed account
    return <Redirect to="/" />;

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    const isManager = user.role === "admin" || user.role === "librarian";
    return <Redirect to={isManager ? "/admin/dashboard" : "/"} />;
  }
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/login">{() => <PublicRoute component={LoginPage} />}</Route>
      <Route path="/register">{() => <PublicRoute component={RegisterPage} />}</Route>
      <Route path="/">{() => {
        const { user } = useAuth();
        const isManager = user?.role === "admin" || user?.role === "librarian";
        if (isManager) return <Redirect to="/admin/dashboard" />;
        return <ProtectedRoute component={HomePage} />;
      }}</Route>
      <Route path="/books">{() => <ProtectedRoute component={BooksPage} />}</Route>
      <Route path="/books/:id">{() => <ProtectedRoute component={BookDetailPage} />}</Route>
      <Route path="/books/:id/read">{() => <ProtectedRoute component={ReadPage} />}</Route>
      <Route path="/my-list">{() => <ProtectedRoute component={MyListPage} />}</Route>
      <Route path="/borrowed">{() => <ProtectedRoute component={BorrowedPage} />}</Route>
      <Route path="/profile">{() => <ProtectedRoute component={ProfilePage} />}</Route>
      <Route path="/admin/dashboard">{() => <ProtectedRoute component={AdminDashboardPage} adminOnly />}</Route>
      <Route path="/admin/books">{() => <ProtectedRoute component={AdminBooksPage} adminOnly />}</Route>
      <Route path="/admin/users">{() => <ProtectedRoute component={AdminUsersPage} adminOnly />}</Route>
      <Route path="/admin/monitoring">{() => <ProtectedRoute component={AdminMonitoringPage} adminOnly />}</Route>
      <Route path="/admin/reservations">{() => <ProtectedRoute component={AdminReservationsPage} adminOnly />}</Route>
      <Route path="/admin/reports">{() => <ProtectedRoute component={AdminReportsPage} adminOnly />}</Route>
      <Route path="/admin/authorized-users">{() => <ProtectedRoute component={AdminAuthorizedUsersPage} adminOnly />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <OfflineBanner />
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
        <PwaUpdatePrompt />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

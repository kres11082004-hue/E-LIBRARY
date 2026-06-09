import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, Users, Settings, LogOut, Library, BookMarked, User as UserIcon } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      setLocation("/login");
      toast({ title: "Logged out successfully" });
    } catch (e) {
      toast({ title: "Failed to logout", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b">
          <Library className="w-8 h-8 text-primary" />
          <span className="font-serif font-bold text-xl text-primary tracking-tight">Athenaeum</span>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted text-sm font-medium transition-colors">
            <Home className="w-4 h-4" /> Dashboard
          </Link>
          <Link href="/books" className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted text-sm font-medium transition-colors">
            <BookOpen className="w-4 h-4" /> Browse Books
          </Link>
          <Link href="/my-list" className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted text-sm font-medium transition-colors">
            <BookMarked className="w-4 h-4" /> My List
          </Link>
          
          {(user?.role === "admin" || user?.role === "librarian") && (
            <>
              <div className="mt-4 mb-2 px-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">Administration</div>
              <Link href="/admin/books" className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted text-sm font-medium transition-colors">
                <BookOpen className="w-4 h-4" /> Manage Books
              </Link>
              {user?.role === "admin" && (
                <Link href="/admin/users" className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted text-sm font-medium transition-colors">
                  <Users className="w-4 h-4" /> Manage Users
                </Link>
              )}
              <Link href="/admin/monitoring" className="flex items-center gap-3 px-4 py-2.5 rounded-md hover:bg-muted text-sm font-medium transition-colors">
                <Settings className="w-4 h-4" /> Monitoring
              </Link>
            </>
          )}
        </nav>
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
              {user?.fullname?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold truncate max-w-[120px]">{user?.fullname}</span>
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="w-full flex items-center gap-2" onClick={() => setLocation("/profile")}>
              <UserIcon className="w-4 h-4" /> Profile
            </Button>
            <Button variant="outline" size="sm" className="w-full flex items-center gap-2 text-destructive hover:text-destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4" /> Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { BookOpen, Home, Users, Settings, LogOut, Library, BookMarked, User as UserIcon, Menu, X, CalendarCheck, Clock, Wifi, WifiOff } from "lucide-react";
import { useLogout } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useState } from "react";

function NavLink({ href, icon: Icon, children }: { href: string; icon: React.ElementType; children: React.ReactNode }) {
  const [location] = useLocation();
  const active = location === href || (href !== "/" && location.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground/70 hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {children}
    </Link>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const logoutMutation = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isOnline = useOnlineStatus();

  const isManager = user?.role === "admin" || user?.role === "librarian";

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      setLocation("/login");
      toast({ title: "Logged out successfully" });
    } catch {
      toast({ title: "Failed to logout", variant: "destructive" });
    }
  };

  const roleLabel = user?.role === "admin" || user?.role === "librarian"
    ? "Admin/Librarian"
    : user?.role === "instructor"
    ? "Instructor / Faculty"
    : "Student";

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b shrink-0">
        <img src="/logo.jpg" alt="ZDSPGC Logo" className="w-8 h-8 rounded-full object-cover shrink-0" />
        <div className="min-w-0">
          <p className="font-bold text-sm text-primary leading-tight">ZDSPGC</p>
          <p className="text-xs text-primary/80 leading-tight">E-Library</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
        {isManager ? (
          <>
            <p className="px-4 mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">Dashboard</p>
            <NavLink href="/admin/dashboard" icon={Home}>Dashboard</NavLink>

            <div className="mt-5 mb-2 px-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">Management</div>
            <NavLink href="/admin/books" icon={BookOpen}>Manage Books</NavLink>
            <NavLink href="/admin/users" icon={Users}>Manage Users</NavLink>
            <NavLink href="/admin/reservations" icon={CalendarCheck}>Reservations</NavLink>

            <div className="mt-5 mb-2 px-4 text-xs font-bold tracking-wider text-muted-foreground uppercase">Monitoring</div>
            <NavLink href="/admin/monitoring" icon={Settings}>Library Monitoring</NavLink>
            <NavLink href="/admin/reports" icon={Library}>Reports</NavLink>
          </>
        ) : (
          <>
            <p className="px-4 mb-2 text-xs font-bold tracking-wider text-muted-foreground uppercase">Library</p>
            <NavLink href="/" icon={Home}>Dashboard</NavLink>
            <NavLink href="/books" icon={BookOpen}>Browse Books</NavLink>
            <NavLink href="/my-list" icon={BookMarked}>My Reading List</NavLink>
            <NavLink href="/borrowed" icon={Clock}>Borrowed Books</NavLink>
          </>
        )}
      </nav>

      {/* User footer */}
      <div className="p-4 border-t shrink-0">
        {/* Online/Offline indicator */}
        <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md mb-3 text-xs font-medium ${
          isOnline
            ? "bg-green-500/10 text-green-600"
            : "bg-amber-500/10 text-amber-600"
        }`}>
          {isOnline
            ? <Wifi className="w-3 h-3 shrink-0" />
            : <WifiOff className="w-3 h-3 shrink-0 animate-pulse" />
          }
          <span>{isOnline ? "Online" : "Offline — cached mode"}</span>
        </div>
        <div className="flex items-center gap-3 mb-3 px-2">
          {user?.photoUrl ? (
            <div className="w-9 h-9 rounded-full border overflow-hidden shrink-0">
              <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
              {user?.fullname?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold truncate">{user?.fullname}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => { setLocation("/profile"); setMobileOpen(false); }}>
            <UserIcon className="w-3.5 h-3.5" /> Profile
          </Button>
          <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-destructive hover:text-destructive hover:border-destructive/50" onClick={handleLogout}>
            <LogOut className="w-3.5 h-3.5" /> Logout
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-card border-r flex-col shrink-0 fixed top-0 left-0 bottom-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card border-b sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <img src="/logo.jpg" alt="ZDSPGC Logo" className="w-7 h-7 rounded-full object-cover shrink-0" />
          <div>
            <p className="font-bold text-sm text-primary leading-tight">ZDSPGC E-Library</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="p-2 rounded-md hover:bg-muted transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside
            className="absolute top-0 left-0 bottom-0 w-72 bg-card flex flex-col shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 md:ml-64 overflow-auto">
        {children}
      </main>
    </div>
  );
}

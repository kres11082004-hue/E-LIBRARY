import { useState } from "react";
import { useListUsers, useUpdateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, Trash2, Users, Filter } from "lucide-react";

const CAMPUSES = [
  "All",
  "ZDSPGC-Aurora Campus",
  "ZDSPGC-Bayog Campus",
  "ZDSPGC-Dimataling Campus",
  "ZDSPGC-Dumingag Campus",
  "ZDSPGC-Guipos Campus",
  "ZDSPGC-Josefina Campus",
  "ZDSPGC-Kumalarang Campus",
  "ZDSPGC-Lakewood Campus",
  "ZDSPGC-Lapuyan Campus",
  "ZDSPGC-Mahayag Campus",
  "ZDSPGC-Margosatubig Campus",
  "ZDSPGC-Midsalip Campus",
  "ZDSPGC-Molave Campus",
  "ZDSPGC-Pagadian Campus",
  "ZDSPGC-Ramon Magsaysay Campus",
  "ZDSPGC-San Pablo Campus",
  "ZDSPGC-Tambulig Campus",
  "ZDSPGC-Tigbao Campus",
  "ZDSPGC-Tukuran Campus",
  "ZDSPGC-Vincenzo Sagun Campus",
];
const ROLES = ["All", "student", "instructor", "librarian", "admin"];

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  librarian: "bg-blue-100 text-blue-700",
  instructor: "bg-amber-100 text-amber-700",
  student: "bg-green-100 text-green-700",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [campus, setCampus] = useState("All");
  const [role, setRole] = useState("All");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useListUsers({
    campus: campus !== "All" ? campus : undefined,
    role: role !== "All" ? role : undefined,
  });
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const filtered = users.filter(u =>
    !search || u.fullname.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleApprove = async (id: number, current: boolean) => {
    try {
      await updateMutation.mutateAsync({ id, data: { isApproved: !current } });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: current ? "User suspended" : "User approved" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "User deleted" });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const pending = filtered.filter(u => !u.isApproved).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {filtered.length} users {pending > 0 && <span className="text-amber-600 font-medium">· {pending} pending approval</span>}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={campus} onValueChange={setCampus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{CAMPUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map(r => {
                let display = r === "All" ? "All Roles" : r;
                if (r === "admin") display = "Admin/Librarian";
                if (r === "librarian") display = "Admin/Librarian (Legacy)";
                return (
                  <SelectItem key={r} value={r}>
                    {display}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-foreground">No users found</p>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Role</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Campus</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Academic Info</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.photoUrl ? (
                        <div className="w-9 h-9 rounded-full border overflow-hidden shrink-0">
                          <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                          {user.fullname.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm text-foreground">{user.fullname}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] || "bg-secondary text-secondary-foreground"}`}>
                      {user.role === "admin" || user.role === "librarian" ? "Admin/Librarian" : user.role}
                    </span>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">{user.campus}</td>
                  <td className="p-4 hidden lg:table-cell">
                    {user.role === "student" && user.course ? (
                      <div className="text-xs text-muted-foreground">
                        <p className="truncate max-w-[160px]">{user.course}</p>
                        <p>{user.year} — Sec {user.section}</p>
                        <p className="font-mono">{user.studentNumber}</p>
                      </div>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {user.isApproved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-8 gap-1 text-xs ${user.isApproved ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`}
                        onClick={() => handleApprove(user.id, user.isApproved ?? false)}
                        disabled={updateMutation.isPending}
                      >
                        {user.isApproved ? <><XCircle className="w-3 h-3" /> Suspend</> : <><CheckCircle className="w-3 h-3" /> Approve</>}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(user.id, user.fullname)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

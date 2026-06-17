import { useState } from "react";
import { useListUsers, useUpdateUser, useDeleteUser, getListUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, XCircle, Trash2, Users, Filter, Building, Phone, MapPin, GraduationCap, Clock } from "lucide-react";
import { BackButton } from "@/components/back-button";

const CAMPUSES = [
  "All",
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
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
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
      <BackButton />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((user) => (
            <div 
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className="bg-card border rounded-xl p-4 flex flex-col items-center text-center cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="w-20 h-20 rounded-full border-4 border-muted overflow-hidden mb-3 group-hover:border-primary/20 transition-colors shrink-0">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
                    {user.fullname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-foreground line-clamp-1 w-full">{user.fullname}</h3>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-1 w-full">{user.email}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role] || "bg-secondary text-secondary-foreground"}`}>
                  {user.role === "admin" || user.role === "librarian" ? "Admin" : user.role}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${user.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {user.isApproved ? "Approved" : "Pending"}
                </span>
              </div>

              <div className="mt-auto w-full flex items-center justify-between gap-2 border-t pt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className={`flex-1 h-8 text-xs ${user.isApproved ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"}`}
                  onClick={(e) => { e.stopPropagation(); handleApprove(user.id, user.isApproved ?? false); }}
                  disabled={updateMutation.isPending}
                >
                  {user.isApproved ? <><XCircle className="w-3 h-3 mr-1" /> Suspend</> : <><CheckCircle className="w-3 h-3 mr-1" /> Approve</>}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-none h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={(e) => { e.stopPropagation(); handleDelete(user.id, user.fullname); }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        {selectedUser && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-24 h-24 rounded-full border-4 border-muted overflow-hidden mb-4">
                {selectedUser.photoUrl ? (
                  <img src={selectedUser.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                    {selectedUser.fullname.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground">{selectedUser.fullname}</h2>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[selectedUser.role] || "bg-secondary"}`}>
                  {selectedUser.role === "admin" || selectedUser.role === "librarian" ? "Admin/Librarian" : selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                </span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${selectedUser.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {selectedUser.isApproved ? "Approved" : "Pending Approval"}
                </span>
              </div>
            </div>

            <div className="grid gap-3 mt-4 bg-muted/30 p-4 rounded-xl border">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Building className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium shrink-0">Campus:</span> 
                <span className="text-muted-foreground truncate">{selectedUser.campus}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium shrink-0">Phone:</span> 
                <span className="text-muted-foreground">{selectedUser.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-foreground">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium shrink-0">Address:</span> 
                <span className="text-muted-foreground line-clamp-2">{selectedUser.address || "—"}</span>
              </div>
              
              {selectedUser.role === "student" && (
                <>
                  <div className="h-px bg-border my-2" />
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <GraduationCap className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium shrink-0">Course:</span> 
                    <span className="text-muted-foreground truncate">{selectedUser.course || "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium shrink-0">Year/Sec:</span> 
                    <span className="text-muted-foreground">{selectedUser.year ? `${selectedUser.year} — Sec ${selectedUser.section}` : "—"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="font-medium shrink-0">Student No:</span> 
                    <span className="text-muted-foreground font-mono">{selectedUser.studentNumber || "—"}</span>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-2 mt-2">
              <Button
                className={`flex-1 ${selectedUser.isApproved ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                variant="secondary"
                onClick={() => {
                  handleApprove(selectedUser.id, selectedUser.isApproved ?? false);
                  setSelectedUser({ ...selectedUser, isApproved: !selectedUser.isApproved });
                }}
                disabled={updateMutation.isPending}
              >
                {selectedUser.isApproved ? <><XCircle className="w-4 h-4 mr-2" /> Suspend User</> : <><CheckCircle className="w-4 h-4 mr-2" /> Approve User</>}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

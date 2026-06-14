import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useUpdateUser, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Phone, MapPin, Building, BookOpen, Hash, GraduationCap } from "lucide-react";

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground font-medium">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, login, token } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullname: user?.fullname || "", phone: user?.phone || "", address: user?.address || "" });
  const updateMutation = useUpdateUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  if (!user) return null;

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateMutation.mutateAsync({ id: user.id, data: form });
      login(token!, updated);
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({ title: "Profile updated successfully" });
      setEditing(false);
    } catch {
      toast({ title: "Failed to update profile", variant: "destructive" });
    }
  };

  const roleLabel: Record<string, string> = {
    admin: "Admin/Librarian",
    librarian: "Admin/Librarian",
    instructor: "Instructor / Faculty",
    student: "Student",
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      {/* Avatar + Name */}
      <div className="bg-card border rounded-xl p-6 flex items-center gap-5">
        {user.photoUrl ? (
          <div className="w-16 h-16 rounded-full border overflow-hidden shrink-0">
            <img src={user.photoUrl} alt={user.fullname} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold shrink-0">
            {user.fullname.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h2 className="text-lg font-bold text-foreground">{user.fullname}</h2>
          <p className="text-sm text-muted-foreground">{roleLabel[user.role] || user.role}</p>
          <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${user.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
            {user.isApproved ? "Approved" : "Pending Approval"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="bg-card border rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Account Information</h3>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.fullname} onChange={set("fullname")} required />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={form.phone} onChange={set("phone")} required />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={form.address} onChange={set("address")} required />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </form>
        ) : (
          <div className="grid gap-4">
            <InfoRow icon={User} label="Full Name" value={user.fullname} />
            <InfoRow icon={Mail} label="Email" value={user.email} />
            <InfoRow icon={Phone} label="Phone" value={user.phone} />
            <InfoRow icon={MapPin} label="Address" value={user.address} />
            <InfoRow icon={Building} label="Campus" value={user.campus} />
          </div>
        )}
      </div>

      {/* Student Info */}
      {user.role === "student" && (
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold text-foreground">Academic Information</h3>
          <div className="grid gap-4">
            <InfoRow icon={Hash} label="Student Number" value={user.studentNumber} />
            <InfoRow icon={GraduationCap} label="Course" value={user.course} />
            <InfoRow icon={BookOpen} label="Year Level" value={user.year} />
            <InfoRow icon={User} label="Section" value={user.section} />
          </div>
        </div>
      )}

      {/* Account Details */}
      <div className="bg-card border rounded-xl p-6 space-y-3">
        <h3 className="font-semibold text-foreground">Account Details</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Account ID: <span className="font-mono text-foreground">#{user.id}</span></p>
          <p>Role: <span className="text-foreground capitalize">{roleLabel[user.role] || user.role}</span></p>
          <p>Member since: <span className="text-foreground">{new Date(user.createdAt).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</span></p>
        </div>
      </div>
    </div>
  );
}

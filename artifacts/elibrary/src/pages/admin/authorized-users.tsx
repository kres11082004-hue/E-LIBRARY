import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, Trash2, ShieldCheck, Link2, Upload } from "lucide-react";
import * as XLSX from "xlsx";

// Assuming we use standard fetch for simplicity if the typed client isn't ready
const fetchAuthorizedUsers = async (search: string, role: string) => {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (role !== "All") params.set("role", role);
  
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/authorized-users?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to fetch authorized users");
  return res.json();
};

const createAuthorizedUser = async (data: any) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/authorized-users`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create record");
  }
  return res.json();
};

const deleteAuthorizedUser = async (id: number) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/authorized-users/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error("Failed to delete record");
  return res.json();
};

const importAuthorizedUsers = async (data: any[]) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/authorized-users/import`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to import records");
  }
  return res.json();
};

export default function AuthorizedUsersAdmin() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  const [newFullName, setNewFullName] = useState("");
  const [newSchoolId, setNewSchoolId] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [newCourse, setNewCourse] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: records, isLoading } = useQuery({
    queryKey: ["authorized-users", search, roleFilter],
    queryFn: () => fetchAuthorizedUsers(search, roleFilter),
  });

  const createMutation = useMutation({
    mutationFn: createAuthorizedUser,
    onSuccess: () => {
      toast({ title: "Record added successfully" });
      queryClient.invalidateQueries({ queryKey: ["authorized-users"] });
      setIsAddOpen(false);
      setNewFullName("");
      setNewSchoolId("");
      setNewRole("student");
      setNewCourse("");
    },
    onError: (err: any) => {
      toast({ title: "Failed to add record", description: err.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAuthorizedUser,
    onSuccess: () => {
      toast({ title: "Record deleted" });
      queryClient.invalidateQueries({ queryKey: ["authorized-users"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to delete record", description: err.message, variant: "destructive" });
    }
  });

  const importMutation = useMutation({
    mutationFn: importAuthorizedUsers,
    onSuccess: (data) => {
      toast({ 
        title: "Import completed", 
        description: `Imported ${data.importedCount} new records. Skipped ${data.skippedCount} duplicates/invalid.` 
      });
      queryClient.invalidateQueries({ queryKey: ["authorized-users"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to import records", description: err.message, variant: "destructive" });
    }
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ fullName: newFullName, schoolId: newSchoolId, role: newRole, course: newCourse });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        if (rawData.length < 2) {
          toast({ title: "Invalid File", description: "File must contain a header row and at least one data row.", variant: "destructive" });
          return;
        }

        // Find the header row (sometimes row 0 is a title row)
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
          const rowStr = rawData[i].map(c => String(c).toLowerCase()).join(' ');
          if (rowStr.includes('employee number') || rowStr.includes('student number') || rowStr.includes('last name') || rowStr.includes('new a.y.')) {
            headerRowIndex = i;
            break;
          }
        }

        const headers = rawData[headerRowIndex].map(h => String(h).trim().toLowerCase());
        const dataRows = rawData.slice(headerRowIndex + 1);

        const parsedData = dataRows.map(row => {
          const record: any = {};
          headers.forEach((h, i) => {
            if (row[i] !== undefined && row[i] !== null && String(row[i]).trim() !== '') {
              // Only assign if the key doesn't exist yet, to prevent duplicate columns like 'employee number' from overwriting each other if the latter is empty
              if (!record[h]) {
                record[h] = String(row[i]).trim();
              }
            }
          });
          // Handle specific column mappings from the uploaded file
          if (record['student number']) {
            record.schoolId = record['student number'];
            record.role = 'student';
          } else if (record['employee number']) {
            record.schoolId = record['employee number'];
            record.role = 'instructor';
          } else if (record['id number']) {
            record.schoolId = record['id number'];
          } else if (record.schoolid && !record.schoolId) {
            record.schoolId = record.schoolid;
          }

          if (record['designation']) {
             record.role = 'instructor';
          }

          // Construct fullName from last name, first name, and middle name
          if (record['last name'] || record['first name']) {
            const last = record['last name'] ? record['last name'].trim() : '';
            const first = record['first name'] ? record['first name'].trim() : '';
            const middle = record['middle name'] ? record['middle name'].trim() : '';
            const suffix = record['suffix name'] ? record['suffix name'].trim() : '';
            
            const nameParts = [];
            if (last) nameParts.push(last + (first || middle || suffix ? ',' : ''));
            if (first) nameParts.push(first);
            if (middle) {
              if (middle.length === 1) nameParts.push(middle + '.');
              else nameParts.push(middle);
            }
            if (suffix) nameParts.push(suffix);
            record.fullName = nameParts.join(' ').trim();
          } else if (record['new a.y. 2025-2026'] && !record.fullName) {
            record.fullName = record['new a.y. 2025-2026'];
          } else if (record['old'] && !record.fullName) {
            record.fullName = record['old'];
          } else if (record.fullname && !record.fullName) {
            record.fullName = record.fullname;
          }

          // Default role if not mapped
          if (!record.role) {
            record.role = 'student';
          }

          return record;
        });

        const validData = parsedData.filter(row => Object.keys(row).length > 0 && row.fullName && row.schoolId);

        if (validData.length === 0) {
           toast({ title: "No valid data", description: "Could not find any valid rows with fullName and schoolId.", variant: "destructive" });
           return;
        }

        importMutation.mutate(validData);
      } catch (err) {
        toast({ title: "Error parsing file", description: "Make sure it is a valid spreadsheet file.", variant: "destructive" });
      }
      
      // Reset input
      if (e.target) e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Authorized Users List</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage the master list of students and instructors allowed to register.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div>
            <input 
              type="file" 
              accept=".csv, .xlsx, .xls" 
              className="hidden" 
              id="file-upload" 
              onChange={handleFileUpload} 
              disabled={importMutation.isPending}
            />
            <Label htmlFor="file-upload">
              <div className={`inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2 cursor-pointer ${importMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload className="w-4 h-4" /> {importMutation.isPending ? "Importing..." : "Import Files"}
              </div>
            </Label>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Add Record
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Authorized User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} required placeholder="Lastname, Firstname M." />
              </div>
              <div className="space-y-2">
                <Label>{newRole === 'student' ? 'Student ID #' : 'Employee ID Number'}</Label>
                <Input value={newSchoolId} onChange={(e) => setNewSchoolId(e.target.value)} required placeholder="e.g. 2024-0001" />
              </div>
              {newRole !== "instructor" && (
                <div className="space-y-2">
                  <Label>Course/Department</Label>
                  <Input value={newCourse} onChange={(e) => setNewCourse(e.target.value)} placeholder="e.g. BSCS (Optional)" />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Record"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="All">All Roles</TabsTrigger>
            <TabsTrigger value="student">Students</TabsTrigger>
            <TabsTrigger value="instructor">Instructors</TabsTrigger>
          </TabsList>
          
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or ID..."
              className="pl-9 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

      <div className="rounded-md border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>{roleFilter === 'student' ? 'Student ID #' : roleFilter === 'instructor' ? 'Employee ID' : 'School / Employee ID'}</TableHead>
              <TableHead>Role</TableHead>
              {roleFilter !== "instructor" && <TableHead>Course</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading records...</TableCell>
              </TableRow>
            ) : records?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No authorized users found.</TableCell>
              </TableRow>
            ) : (
              records?.map((record: any) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.fullName}</TableCell>
                  <TableCell>{record.schoolId}</TableCell>
                  <TableCell className="capitalize">{record.role}</TableCell>
                  {roleFilter !== "instructor" && <TableCell>{record.course || "-"}</TableCell>}
                  <TableCell>
                    {record.linkedUserId ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        <Link2 className="w-3.5 h-3.5" /> Registered
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        <ShieldCheck className="w-3.5 h-3.5" /> Unregistered
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Are you sure you want to remove this record?")) {
                          deleteMutation.mutate(record.id);
                        }
                      }}
                      disabled={deleteMutation.isPending || !!record.linkedUserId}
                      title={record.linkedUserId ? "Cannot delete registered users" : "Delete record"}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </Tabs>
    </div>
  );
}

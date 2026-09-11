import { useState, useMemo } from "react";
import { useListBooks, useCreateBook, useUpdateBook, useDeleteBook, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BookOpen, Search, FileText, BookText, CheckCircle2, Circle, Link2, Loader2, Sparkles, Building2, ChevronLeft, ArrowRight, Upload, Image, Globe, X, Check } from "lucide-react";
import { BackButton } from "@/components/back-button";
import { DEPARTMENTS } from "@/lib/department-utils";
import { Badge } from "@/components/ui/badge";

const CATEGORIES = ["Computer Science", "Information Systems", "Programming", "Database Management", "Networking & Security", "Physical Education", "Sports Science", "Health & Fitness", "Mathematics", "General Education", "Thesis & Research"];
const CAMPUSES = [
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

const emptyForm = {
  title: "", author: "", description: "", content: "", category: "Information Systems", campus: "ZDSPGC-Molave Campus",
  department: "Department of Information System (BSIS)",
  coverUrl: "", fileUrl: "", isbn: "", publishedYear: "", isAvailablePhysical: false, totalCopies: "0",
};

export default function AdminBooksPage() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Department state: null = root department selector, or string name
  const [deptFilter, setDeptFilter] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const param = params.get("department");
    if (!param) return null;
    if (param.toUpperCase() === "BSIS" || param.toLowerCase().includes("information system")) {
      return "Department of Information System (BSIS)";
    }
    if (param.toUpperCase() === "BPED" || param.toLowerCase().includes("physical education")) {
      return "Department of Physical Education (BPED)";
    }
    return param;
  });

  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: number; title: string } | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importTab, setImportTab] = useState<"url" | "search">("url");
  const [searchOnlineQuery, setSearchOnlineQuery] = useState("");
  const [onlineSearchResults, setOnlineSearchResults] = useState<any[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image file (PNG, JPG, WEBP).", variant: "destructive" });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Cover image must be smaller than 8MB.", variant: "destructive" });
      return;
    }

    setUploadingCover(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const token = localStorage.getItem("token");
        const res = await fetch("/api/upload/cover", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imageBase64: base64, filename: file.name }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(err.error || "Upload failed");
        }

        const data = await res.json();
        setForm(f => ({ ...f, coverUrl: data.coverUrl }));
        toast({ title: "Cover uploaded!", description: "Book cover image saved successfully." });
        setUploadingCover(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setUploadingCover(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "File must be smaller than 50MB.", variant: "destructive" });
      return;
    }

    setUploadingFile(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        const token = localStorage.getItem("token");
        const res = await fetch("/api/upload/file", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ fileBase64: base64, filename: file.name }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Upload failed" }));
          throw new Error(err.error || "Upload failed");
        }

        const data = await res.json();
        setForm(f => ({ 
          ...f, 
          fileUrl: data.fileUrl,
          content: data.extractedText || f.content 
        }));
        toast({ title: "File uploaded!", description: "Book file saved successfully." });
        setUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setUploadingFile(false);
    }
  };

  const handleSearchOnline = async () => {
    if (!searchOnlineQuery.trim()) return;
    setIsSearchingOnline(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/books/search-external?query=${encodeURIComponent(searchOnlineQuery.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to search online books");
      const results = await res.json();
      setOnlineSearchResults(results);
      if (results.length === 0) {
        toast({ title: "No books found", description: "Try searching with a different title or ISBN." });
      }
    } catch (err: any) {
      toast({ title: "Search failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSearchingOnline(false);
    }
  };

  const applyOnlineBook = (book: any) => {
    setForm(f => ({
      ...f,
      title: book.title || f.title,
      author: book.author || f.author,
      description: book.description || f.description,
      coverUrl: book.coverUrl || f.coverUrl,
      isbn: book.isbn || f.isbn,
      publishedYear: book.publishedYear ? String(book.publishedYear) : f.publishedYear,
      category: book.category && CATEGORIES.includes(book.category) ? book.category : f.category,
      fileUrl: book.fileUrl || f.fileUrl,
    }));
    toast({ title: "Book details applied!", description: `Filled details for "${book.title}".` });
  };

  const handleImportUrl = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/books/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to fetch" }));
        throw new Error(err.error || "Import failed");
      }
      const meta = await res.json();
      setForm(f => ({
        ...f,
        title: meta.title || f.title,
        author: meta.author || f.author,
        description: meta.description || f.description,
        coverUrl: meta.coverUrl || f.coverUrl,
        isbn: meta.isbn || f.isbn,
        publishedYear: meta.publishedYear ? String(meta.publishedYear) : f.publishedYear,
        category: meta.category && CATEGORIES.includes(meta.category) ? meta.category : f.category,
        fileUrl: meta.fileUrl || f.fileUrl,
      }));
      toast({ title: "Book details imported!", description: "Review the fields below and fill in anything missing." });
      setImportUrl("");
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const { data: allBooks = [], isLoading } = useListBooks({ search: search || undefined });
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();
  const deleteMutation = useDeleteBook();

  // Calculate department book counts
  const { bsisCount, bpedCount } = useMemo(() => {
    let bsis = 0;
    let bped = 0;
    allBooks.forEach((b: any) => {
      const dept = (b.department || "").toLowerCase();
      const title = (b.title || "").toLowerCase();
      const cat = (b.category || "").toLowerCase();
      if (dept.includes("bped") || dept.includes("physical education") || cat.includes("education") || title.includes("sport") || title.includes("physic")) {
        bped++;
      } else {
        bsis++;
      }
    });
    return { bsisCount: bsis, bpedCount: bped };
  }, [allBooks]);

  // Filter books when inside a department
  const filteredBooks = useMemo(() => {
    if (!deptFilter) return allBooks;
    const filterLower = deptFilter.toLowerCase();
    return allBooks.filter((b: any) => {
      const dept = (b.department || "").toLowerCase();
      const title = (b.title || "").toLowerCase();
      const cat = (b.category || "").toLowerCase();

      if (filterLower.includes("bsis") || filterLower.includes("information system")) {
        return dept.includes("bsis") || dept.includes("information system") || cat.includes("tech") || title.includes("program") || title.includes("system") || title.includes("data") || title.includes("code") || !dept.includes("physical education");
      }
      if (filterLower.includes("bped") || filterLower.includes("physical education")) {
        return dept.includes("bped") || dept.includes("physical education") || cat.includes("education") || title.includes("sport") || title.includes("physic") || title.includes("health");
      }
      return dept.includes(filterLower);
    });
  }, [allBooks, deptFilter]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const openCreateInDepartment = (departmentName: string) => {
    setForm({ ...emptyForm, department: departmentName });
    setEditId(null);
    setShowDialog(true);
  };

  const openEdit = (book: any) => {
    setForm({
      title: book.title,
      author: book.author,
      description: book.description,
      content: book.content || "",
      category: book.category,
      campus: book.campus,
      department: book.department || "Department of Information System (BSIS)",
      coverUrl: book.coverUrl || "",
      fileUrl: book.fileUrl || "",
      isbn: book.isbn || "",
      publishedYear: book.publishedYear?.toString() || "",
      isAvailablePhysical: book.isAvailablePhysical,
      totalCopies: book.totalCopies.toString(),
    });
    setEditId(book.id);
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteConfirmId.id });
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      toast({ title: "Book deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      author: form.author,
      description: form.description,
      content: form.content || null,
      category: form.category,
      campus: form.campus,
      department: form.department,
      coverUrl: form.coverUrl || null,
      fileUrl: form.fileUrl || null,
      isbn: form.isbn || null,
      publishedYear: form.publishedYear ? parseInt(form.publishedYear) : null,
      isAvailablePhysical: form.isAvailablePhysical,
      totalCopies: parseInt(form.totalCopies) || 0,
    };
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
        toast({ title: "Book updated successfully" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: `Book added & assigned to ${form.department}` });
      }
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      setShowDialog(false);
    } catch (err: any) {
      const errorMsg = err?.data?.error || err?.response?.data?.error || err?.message || "Failed to save book";
      toast({ title: "Failed to save book", description: errorMsg, variant: "destructive" });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isBSIS = deptFilter?.includes("BSIS") || deptFilter?.includes("Information System");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back button */}
      {deptFilter ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeptFilter(null)}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Department Selection
        </Button>
      ) : (
        <BackButton />
      )}

      {/* ── CASE 1: ROOT DEPARTMENT SELECTION VIEW (NOT INSIDE A DEPARTMENT YET) ── */}
      {!deptFilter && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              Manage Department Libraries
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Click a department below to go inside, view its books, and add new books to that department.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* BSIS DEPARTMENT PORTAL CARD */}
            <div
              onClick={() => setDeptFilter("Department of Information System (BSIS)")}
              className="bg-card border-2 border-blue-500/20 hover:border-blue-500/80 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all pointer-events-none" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="default" className="bg-blue-600 text-white font-bold px-3 py-1 text-xs">
                    BSIS
                  </Badge>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    Academic Department
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-foreground group-hover:text-blue-600 transition-colors">
                  Department of Information System
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Contains all textbook resources, lecture modules, reference material, and research papers for Information Systems &amp; Technology.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-blue-600">{bsisCount}</span>
                  <span className="text-xs text-muted-foreground ml-1.5 font-medium">Books Assigned</span>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-medium shadow-md">
                  Go Inside Department <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* BPED DEPARTMENT PORTAL CARD */}
            <div
              onClick={() => setDeptFilter("Department of Physical Education (BPED)")}
              className="bg-card border-2 border-emerald-500/20 hover:border-emerald-500/80 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <Badge variant="default" className="bg-emerald-600 text-white font-bold px-3 py-1 text-xs">
                    BPED
                  </Badge>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Academic Department
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-foreground group-hover:text-emerald-600 transition-colors">
                  Department of Physical Education
                </h2>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Contains all reference guides, sports science materials, physical fitness manuals, and curriculum books for Physical Education.
                </p>
              </div>

              <div className="pt-6 mt-6 border-t flex items-center justify-between">
                <div>
                  <span className="text-3xl font-black text-emerald-600">{bpedCount}</span>
                  <span className="text-xs text-muted-foreground ml-1.5 font-medium">Books Assigned</span>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-medium shadow-md">
                  Go Inside Department <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── CASE 2: INSIDE A SPECIFIC DEPARTMENT WORKSPACE ── */}
      {deptFilter && (
        <div className="space-y-6">
          {/* Department Workspace Banner */}
          <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
            isBSIS
              ? "bg-gradient-to-r from-blue-500/15 via-indigo-500/5 to-transparent border-blue-500/30"
              : "bg-gradient-to-r from-emerald-500/15 via-teal-500/5 to-transparent border-emerald-500/30"
          }`}>
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="default" className={isBSIS ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}>
                  {isBSIS ? "BSIS" : "BPED"}
                </Badge>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Department Workspace</span>
              </div>
              <h1 className="text-2xl font-extrabold text-foreground">
                {deptFilter}
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Inside Department Workspace — Viewing {filteredBooks.length} books. Books added here will automatically belong to <strong>{isBSIS ? "BSIS" : "BPED"}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Button
                onClick={() => openCreateInDepartment(deptFilter)}
                className={`gap-2 shadow-lg font-semibold px-5 h-11 ${
                  isBSIS
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                <Plus className="w-5 h-5" /> + Add Book to {isBSIS ? "BSIS" : "BPED"} Department
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={`Search ${isBSIS ? "BSIS" : "BPED"} department books by title, author, description...`} value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          {/* Books table */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center bg-card border rounded-xl">
              <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="font-medium text-foreground text-base">No books inside this department yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Click the button below to add the first book assigned to {isBSIS ? "BSIS" : "BPED"} Department.
              </p>
              <Button
                className={`mt-4 gap-2 ${isBSIS ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
                onClick={() => openCreateInDepartment(deptFilter)}
              >
                <Plus className="w-4 h-4" /> Add Book to {isBSIS ? "BSIS" : "BPED"} Department
              </Button>
            </div>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Book</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                    <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Digital Content</th>
                    <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Physical Copies</th>
                    <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredBooks.map((book: any) => {
                    return (
                      <tr key={book.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-14 bg-muted rounded overflow-hidden shrink-0">
                              {book.coverUrl ? (
                                <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <BookOpen className="w-4 h-4 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground truncate max-w-[220px]">{book.title}</p>
                              <p className="text-xs text-muted-foreground">{book.author}</p>
                              {book.isbn && (
                                <p className="text-xs text-muted-foreground/70 font-mono">ISBN: {book.isbn}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline" className={
                            isBSIS
                              ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                          }>
                            {isBSIS ? "BSIS Dept" : "BPED Dept"}
                          </Badge>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{book.category}</span>
                        </td>
                        <td className="p-4 hidden lg:table-cell text-center">
                          {book.content || book.fileUrl ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Circle className="w-3.5 h-3.5" /> None
                            </span>
                          )}
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                          {book.isAvailablePhysical ? (
                            <span className="text-xs text-green-600 font-medium">{book.availableCopies}/{book.totalCopies} copies</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => openEdit(book)}>
                              <Pencil className="w-3 h-3" /> Edit
                            </Button>
                            <Button
                              size="sm" variant="ghost"
                              className="h-8 text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteConfirmId({ id: book.id, title: book.title })}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span>{editId ? "Edit Book" : `Add Book to ${form.department.includes("BSIS") ? "BSIS" : "BPED"} Department`}</span>
              {!editId && (
                <Badge className={form.department.includes("BSIS") ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"}>
                  Auto-assigned to {form.department.includes("BSIS") ? "BSIS" : "BPED"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {/* Import & Auto-Fill Section */}
            {!editId && (
              <div className="mb-5 rounded-xl border bg-card p-4 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Auto-Fill Book Details &amp; Cover
                  </div>
                  <div className="flex items-center gap-1 bg-muted p-1 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setImportTab("url")}
                      className={`px-2.5 py-1 rounded-md transition-all ${importTab === "url" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Link2 className="w-3 h-3 inline mr-1" /> Web Link
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportTab("search")}
                      className={`px-2.5 py-1 rounded-md transition-all ${importTab === "search" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Globe className="w-3 h-3 inline mr-1" /> Search Online
                    </button>
                  </div>
                </div>

                {importTab === "url" ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Paste a URL from any website (Google Books, Open Library, Wikipedia, Publisher, etc.) to extract details &amp; cover.
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          className="pl-9 text-sm"
                          placeholder="https://books.google.com/books?id=... or https://any-website.com/book"
                          value={importUrl}
                          onChange={e => setImportUrl(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleImportUrl(); } }}
                          disabled={importing}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleImportUrl}
                        disabled={importing || !importUrl.trim()}
                        className="gap-2 shrink-0 font-medium"
                      >
                        {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</> : "Fetch Details"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Search online book databases (Google Books &amp; Open Library) by Title, Author, or ISBN:
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          className="pl-9 text-sm"
                          placeholder="e.g. Clean Code, Database Systems, or 978-0132350884"
                          value={searchOnlineQuery}
                          onChange={e => setSearchOnlineQuery(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSearchOnline(); } }}
                          disabled={isSearchingOnline}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSearchOnline}
                        disabled={isSearchingOnline || !searchOnlineQuery.trim()}
                        className="gap-2 shrink-0 font-medium"
                      >
                        {isSearchingOnline ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> : "Search Catalog"}
                      </Button>
                    </div>

                    {/* Online Search Results Cards */}
                    {onlineSearchResults.length > 0 && (
                      <div className="mt-3 max-h-48 overflow-y-auto divide-y border rounded-xl bg-background/80">
                        {onlineSearchResults.map((item, idx) => (
                          <div key={idx} className="p-2.5 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-12 bg-muted rounded overflow-hidden shrink-0 border">
                                {item.coverUrl ? (
                                  <img src={item.coverUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs">📖</div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-xs text-foreground truncate">{item.title}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{item.author} {item.publishedYear ? `(${item.publishedYear})` : ""}</p>
                                {item.isbn && <p className="text-[10px] font-mono text-muted-foreground">ISBN: {item.isbn}</p>}
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => applyOnlineBook(item)}
                              className="shrink-0 h-8 text-xs gap-1 hover:bg-primary hover:text-white"
                            >
                              <Check className="w-3 h-3" /> Use Details
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1 gap-2">
                  <BookOpen className="w-4 h-4" /> Book Details
                </TabsTrigger>
                <TabsTrigger value="content" className="flex-1 gap-2">
                  <BookText className="w-4 h-4" /> Full Text Content
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Details */}
              <TabsContent value="details" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  {/* Department Assignment */}
                  <div className="col-span-2 space-y-2 p-3.5 bg-muted/30 border rounded-xl">
                    <Label className="flex items-center gap-2 font-semibold text-foreground">
                      <Building2 className="w-4 h-4 text-primary" />
                      Assigned Department *
                    </Label>
                    <Select value={form.department} onValueChange={(v) => setForm(f => ({ ...f, department: v }))}>
                      <SelectTrigger className="font-medium bg-background"><SelectValue placeholder="Select Department" /></SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      This book will belong specifically to the <strong>{form.department}</strong> library workspace.
                    </p>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={set("title")} required placeholder="e.g. Database Systems & Information Architecture" />
                  </div>

                  <div className="space-y-2">
                    <Label>Author *</Label>
                    <Input value={form.author} onChange={set("author")} required placeholder="e.g. John Doe" />
                  </div>

                  <div className="space-y-2">
                    <Label>ISBN</Label>
                    <Input value={form.isbn} onChange={set("isbn")} placeholder="978-..." />
                  </div>

                  <div className="space-y-2">
                    <Label>Category *</Label>
                    <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Campus *</Label>
                    <Select value={form.campus} onValueChange={(v) => setForm(f => ({ ...f, campus: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{CAMPUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2 space-y-2">
                    <Label>Description *</Label>
                    <textarea
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      value={form.description}
                      onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                      required
                      placeholder="A brief description of the book..."
                    />
                  </div>

                  {/* Enhanced Cover Image Selector Section */}
                  <div className="col-span-2 space-y-3 p-4 border rounded-xl bg-card">
                    <Label className="flex items-center gap-2 font-semibold text-foreground">
                      <Image className="w-4 h-4 text-primary" />
                      Book Cover Image
                    </Label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      {/* Cover Thumbnail Preview */}
                      <div className="relative w-24 h-32 bg-muted border-2 border-dashed rounded-xl overflow-hidden shrink-0 flex flex-col items-center justify-center text-center group">
                        {form.coverUrl ? (
                          <>
                            <img
                              src={form.coverUrl}
                              alt="Book Cover Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => setForm(f => ({ ...f, coverUrl: "" }))}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-90 hover:opacity-100 transition-opacity shadow-md"
                              title="Remove cover image"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="p-2 space-y-1">
                            <BookOpen className="w-6 h-6 text-muted-foreground/50 mx-auto" />
                            <p className="text-[10px] text-muted-foreground font-medium">No Cover Set</p>
                          </div>
                        )}
                      </div>

                      {/* Controls: Upload File + URL Input */}
                      <div className="flex-1 space-y-2.5 w-full">
                        <div className="flex items-center gap-2">
                          <label className="flex-1">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleCoverFileUpload}
                              disabled={uploadingCover}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full gap-2 cursor-pointer border-dashed border-2 hover:border-primary hover:bg-primary/5 text-xs font-semibold h-10"
                              onClick={(e) => {
                                (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                              }}
                              disabled={uploadingCover}
                            >
                              {uploadingCover ? (
                                <><Loader2 className="w-4 h-4 animate-spin text-primary" /> Uploading Cover...</>
                              ) : (
                                <><Upload className="w-4 h-4 text-primary" /> Upload Image File from Computer</>
                              )}
                            </Button>
                          </label>
                        </div>

                        <div className="relative">
                          <Label className="text-[11px] text-muted-foreground mb-1 block">Or enter image web URL directly:</Label>
                          <div className="relative">
                            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <Input
                              className="pl-8 text-xs h-9"
                              value={form.coverUrl}
                              onChange={set("coverUrl")}
                              placeholder="https://images.unsplash.com/... or /uploads/covers/..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 p-4 border rounded-xl bg-card">
                    <Label className="flex items-center gap-2 font-semibold text-foreground">
                      <FileText className="w-4 h-4 text-primary" />
                      Digital Content File (PDF, EPUB, etc.)
                    </Label>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <label className="flex-1">
                          <input
                            type="file"
                            accept=".pdf,.epub,.doc,.docx"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploadingFile}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2 cursor-pointer border-dashed border-2 hover:border-primary hover:bg-primary/5 text-xs font-semibold h-10"
                            onClick={(e) => {
                              (e.currentTarget.previousElementSibling as HTMLInputElement)?.click();
                            }}
                            disabled={uploadingFile}
                          >
                            {uploadingFile ? (
                              <><Loader2 className="w-4 h-4 animate-spin text-primary" /> Uploading File...</>
                            ) : (
                              <><Upload className="w-4 h-4 text-primary" /> Upload Book File (Max 50MB)</>
                            )}
                          </Button>
                        </label>
                      </div>

                      <div className="relative">
                        <Label className="text-[11px] text-muted-foreground mb-1 block">Or provide an external web link:</Label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <Input
                            className="pl-8 text-xs h-9"
                            value={form.fileUrl}
                            onChange={set("fileUrl")}
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Published Year</Label>
                    <Input type="number" value={form.publishedYear} onChange={set("publishedYear")} placeholder="2024" min="1000" max="2100" />
                  </div>

                  {/* Physical Copies */}
                  <div className="col-span-2 space-y-2">
                    <Label className="flex items-center gap-1.5">📚 Physical Copies</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(["none", "available"] as const).map((v) => {
                        const active = v === "none" ? !form.isAvailablePhysical : form.isAvailablePhysical;
                        return (
                          <button
                            key={v}
                            type="button"
                            onClick={() => {
                              if (v === "none") setForm(f => ({ ...f, isAvailablePhysical: false, totalCopies: "0" }));
                              else setForm(f => ({ ...f, isAvailablePhysical: true, totalCopies: f.totalCopies === "0" ? "1" : f.totalCopies }));
                            }}
                            className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-3 text-center transition-all ${
                              active
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-input bg-background text-muted-foreground hover:border-green-300 hover:text-foreground"
                            }`}
                          >
                            <span className="text-xl">{v === "none" ? "🚫" : "📚"}</span>
                            <span className="text-xs font-semibold">{v === "none" ? "None" : "Available"}</span>
                          </button>
                        );
                      })}
                    </div>
                    {form.isAvailablePhysical && (
                      <div className="flex items-center gap-3 pt-1">
                        <Label className="text-sm shrink-0">Number of Copies</Label>
                        <Input
                          type="number"
                          min="1"
                          className="w-28"
                          value={form.totalCopies}
                          onChange={set("totalCopies")}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Content */}
              <TabsContent value="content" className="space-y-3 mt-0">
                <div className="rounded-lg bg-muted/50 border p-4 text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <FileText className="w-4 h-4" /> Full Book Content
                  </div>
                  <p>Edit or update the full text of the book.</p>
                </div>

                <textarea
                  className="w-full min-h-[350px] rounded-md border border-input bg-background px-4 py-3 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                  value={form.content}
                  onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="# Chapter 1\n\nBegin writing or paste content here..."
                  spellCheck
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className={`gap-2 ${form.department.includes("BSIS") ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                {isSaving ? "Saving..." : editId ? "Update Book" : `Add Book to ${form.department.includes("BSIS") ? "BSIS" : "BPED"}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Book?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <strong>"{deleteConfirmId?.title}"</strong>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

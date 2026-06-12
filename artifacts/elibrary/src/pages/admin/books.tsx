import { useState } from "react";
import { useListBooks, useCreateBook, useUpdateBook, useDeleteBook, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BookOpen, Search, FileText, BookText, CheckCircle2, Circle, Link2, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES = ["Fiction", "Non-Fiction", "Science", "Technology", "History", "Philosophy", "Mathematics", "Literature", "Reference", "Thesis"];
const CAMPUSES = [
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

const emptyForm = {
  title: "", author: "", description: "", content: "", category: "Technology", campus: "ZDSPGC-Molave Campus",
  coverUrl: "", fileUrl: "", isbn: "", publishedYear: "", isAvailablePhysical: false, totalCopies: "0",
};

export default function AdminBooksPage() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [deleteConfirmId, setDeleteConfirmId] = useState<{ id: number; title: string } | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: books = [], isLoading } = useListBooks({ search: search || undefined });
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();
  const deleteMutation = useDeleteBook();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const openCreate = () => { setForm({ ...emptyForm }); setEditId(null); setShowDialog(true); };

  const openEdit = (book: any) => {
    setForm({
      title: book.title,
      author: book.author,
      description: book.description,
      content: book.content || "",
      category: book.category,
      campus: book.campus,
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
        toast({ title: "Book added to library" });
      }
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      setShowDialog(false);
    } catch {
      toast({ title: "Failed to save book", variant: "destructive" });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Books</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{books.length} books in library</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" /> Add Book
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search books by title, author, description..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Books table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : books.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium text-foreground">No books found</p>
          <Button className="mt-4" onClick={openCreate}>Add First Book</Button>
        </div>
      ) : (
        <div className="bg-card border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Book</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="text-center p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Digital Content</th>
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Physical</th>
                <th className="text-right p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {books.map((book) => (
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
                        <p className="font-medium text-sm text-foreground truncate max-w-[200px]">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{book.category}</span>
                  </td>
                  <td className="p-4 hidden lg:table-cell text-center">
                    {book.content ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
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
                      <span className="text-xs text-muted-foreground">Digital only</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openEdit(book)}>
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Book" : "Add New Book"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            {/* ── Import from URL ── */}
            {!editId && (
              <div className="mb-5 rounded-xl border bg-muted/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Import from a link
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste a Google Books, Open Library, or any book page URL and we'll auto-fill the details for you.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      className="pl-9 text-sm"
                      placeholder="https://books.google.com/books?id=..."
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
                    className="gap-2 shrink-0"
                  >
                    {importing ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</> : "Fetch Details"}
                  </Button>
                </div>
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

              {/* ── Tab 1: Details ── */}
              <TabsContent value="details" className="space-y-4 mt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Title *</Label>
                    <Input value={form.title} onChange={set("title")} required placeholder="e.g. Introduction to Programming" />
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
                  <div className="space-y-2">
                    <Label>Cover Image URL</Label>
                    <Input value={form.coverUrl} onChange={set("coverUrl")} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>External Read URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input value={form.fileUrl} onChange={set("fileUrl")} placeholder="https://..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Published Year</Label>
                    <Input type="number" value={form.publishedYear} onChange={set("publishedYear")} placeholder="2024" min="1000" max="2100" />
                  </div>
                  <div className="space-y-2">
                    <Label>Physical Copies</Label>
                    <Input type="number" min="0" value={form.totalCopies} onChange={set("totalCopies")} />
                  </div>
                  <div className="col-span-2 flex items-center gap-3 pt-1">
                    <input
                      type="checkbox"
                      id="physical"
                      checked={form.isAvailablePhysical}
                      onChange={(e) => setForm(f => ({ ...f, isAvailablePhysical: e.target.checked }))}
                      className="w-4 h-4 rounded border-input accent-primary"
                    />
                    <Label htmlFor="physical" className="cursor-pointer">Available as physical copy in library</Label>
                  </div>
                </div>
              </TabsContent>

              {/* ── Tab 2: Content ── */}
              <TabsContent value="content" className="space-y-3 mt-0">
                <div className="rounded-lg bg-muted/50 border p-4 text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <FileText className="w-4 h-4" /> Full Book Content
                  </div>
                  <p>Paste or type the full text of the book here. Students and instructors will read it directly inside ZDSPGC E-Library — no external site needed.</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Use <code className="bg-background px-1 rounded"># Chapter Title</code> for chapter headings</li>
                    <li>Use <code className="bg-background px-1 rounded">## Section</code> for sub-headings</li>
                    <li>Separate paragraphs with a blank line</li>
                    <li>Use <code className="bg-background px-1 rounded">---</code> for page breaks / dividers</li>
                  </ul>
                </div>

                {form.content && (
                  <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {form.content.split(/\s+/).filter(Boolean).length.toLocaleString()} words · {form.content.length.toLocaleString()} characters
                  </div>
                )}

                <textarea
                  className="w-full min-h-[400px] rounded-md border border-input bg-background px-4 py-3 text-sm font-mono ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                  value={form.content}
                  onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder={"# Chapter 1\n\nBegin writing or paste the book content here...\n\nSeparate paragraphs with a blank line.\n\n## Section Title\n\nMore content..."}
                  spellCheck
                />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? "Saving..." : editId ? "Update Book" : "Add Book"}
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

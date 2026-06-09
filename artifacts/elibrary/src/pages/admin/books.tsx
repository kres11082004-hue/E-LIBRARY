import { useState } from "react";
import { useListBooks, useCreateBook, useUpdateBook, useDeleteBook, getListBooksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";

const CATEGORIES = ["Fiction", "Non-Fiction", "Science", "Technology", "History", "Philosophy", "Mathematics", "Literature", "Reference", "Thesis"];
const CAMPUSES = ["Main Campus", "North Campus", "South Campus", "East Campus", "West Campus", "Engineering Campus", "Medical Campus", "Business Campus"];

const emptyForm = {
  title: "", author: "", description: "", category: "Technology", campus: "Main Campus",
  coverUrl: "", fileUrl: "", isbn: "", publishedYear: "", isAvailablePhysical: false, totalCopies: "0",
};

export default function AdminBooksPage() {
  const [search, setSearch] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: books = [], isLoading } = useListBooks({ search: search || undefined });
  const createMutation = useCreateBook();
  const updateMutation = useUpdateBook();
  const deleteMutation = useDeleteBook();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const openCreate = () => { setForm({ ...emptyForm }); setEditId(null); setShowDialog(true); };
  const openEdit = (book: any) => {
    setForm({
      title: book.title, author: book.author, description: book.description,
      category: book.category, campus: book.campus, coverUrl: book.coverUrl || "",
      fileUrl: book.fileUrl || "", isbn: book.isbn || "",
      publishedYear: book.publishedYear?.toString() || "",
      isAvailablePhysical: book.isAvailablePhysical, totalCopies: book.totalCopies.toString(),
    });
    setEditId(book.id);
    setShowDialog(true);
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      toast({ title: "Book deleted" });
    } catch { toast({ title: "Failed to delete", variant: "destructive" }); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: form.title, author: form.author, description: form.description,
      category: form.category, campus: form.campus,
      coverUrl: form.coverUrl || null, fileUrl: form.fileUrl || null,
      isbn: form.isbn || null,
      publishedYear: form.publishedYear ? parseInt(form.publishedYear) : null,
      isAvailablePhysical: form.isAvailablePhysical,
      totalCopies: parseInt(form.totalCopies) || 0,
    };
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, data: payload });
        toast({ title: "Book updated" });
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast({ title: "Book added to library" });
      }
      queryClient.invalidateQueries({ queryKey: getListBooksQueryKey() });
      setShowDialog(false);
    } catch { toast({ title: "Failed to save book", variant: "destructive" }); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manage Books</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{books.length} books in library</p>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Add Book</Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

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
                <th className="text-left p-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Campus</th>
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
                          <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-muted-foreground/50" /></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">{book.title}</p>
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell"><span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{book.category}</span></td>
                  <td className="p-4 hidden lg:table-cell text-sm text-muted-foreground">{book.campus}</td>
                  <td className="p-4 hidden lg:table-cell">
                    {book.isAvailablePhysical ? (
                      <span className="text-xs text-green-600 font-medium">{book.availableCopies}/{book.totalCopies}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Digital only</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" className="h-8 gap-1" onClick={() => openEdit(book)}>
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(book.id, book.title)}>
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Book" : "Add New Book"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={set("title")} required />
              </div>
              <div className="space-y-2">
                <Label>Author *</Label>
                <Input value={form.author} onChange={set("author")} required />
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
                  value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} required
                />
              </div>
              <div className="space-y-2">
                <Label>Cover Image URL</Label>
                <Input value={form.coverUrl} onChange={set("coverUrl")} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>File / Read Online URL</Label>
                <Input value={form.fileUrl} onChange={set("fileUrl")} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Published Year</Label>
                <Input type="number" value={form.publishedYear} onChange={set("publishedYear")} placeholder="2024" />
              </div>
              <div className="space-y-2">
                <Label>Physical Copies</Label>
                <Input type="number" min="0" value={form.totalCopies} onChange={set("totalCopies")} />
              </div>
              <div className="col-span-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="physical"
                  checked={form.isAvailablePhysical}
                  onChange={(e) => setForm(f => ({ ...f, isAvailablePhysical: e.target.checked }))}
                  className="w-4 h-4 rounded border-input"
                />
                <Label htmlFor="physical">Available as physical copy in library</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editId ? "Update Book" : "Add Book"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

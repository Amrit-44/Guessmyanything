"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface EntityItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: { name: string; slug: string } | null;
  subcategory: { name: string; slug: string } | null;
  difficulty: number;
  popularity: number;
  isActive: boolean;
  tags: string[];
  createdAt: string;
}

interface CategoryOpt {
  id: string;
  name: string;
  slug: string;
  subcategories: { id: string; name: string; slug: string }[];
}

export function AdminEntities() {
  const [items, setItems] = useState<EntityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EntityItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "25" });
    if (search) params.set("search", search);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    fetch(`/api/admin/entities?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
        setPages(d.pages);
      })
      .finally(() => setLoading(false));
  }, [page, search, categoryFilter]);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/entities/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Entity deleted");
      setDeleteId(null);
      load();
    } else {
      toast.error("Failed to delete");
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(items, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "entities-export.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported current page");
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entities..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="pl-8"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => { setPage(1); setCategoryFilter(v === "all" ? "" : v); }}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)} className="gap-1">
          <Plus className="h-4 w-4" /> New
        </Button>
        <Button variant="outline" onClick={() => setBulkOpen(true)} className="gap-1">
          <Upload className="h-4 w-4" /> Import
        </Button>
        <Button variant="outline" onClick={handleExport} className="gap-1">
          <Download className="h-4 w-4" /> Export
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">{total} entities</div>

      {/* Table */}
      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs">
            <tr>
              <th className="p-2">Name</th>
              <th className="p-2">Category</th>
              <th className="hidden p-2 md:table-cell">Tags</th>
              <th className="hidden p-2 sm:table-cell">Pop</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground blink">LOADING</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No entities found</td></tr>
            ) : (
              items.map((e) => (
                <tr key={e.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-2">
                    <div className="font-medium">{e.name}</div>
                    {e.description && <div className="line-clamp-1 text-xs text-muted-foreground">{e.description}</div>}
                  </td>
                  <td className="p-2 text-xs">{e.category?.name ?? "—"}</td>
                  <td className="hidden max-w-xs p-2 md:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {e.tags.slice(0, 4).map((t) => (
                        <Badge key={t} variant="secondary" className="text-[9px]">{t}</Badge>
                      ))}
                      {e.tags.length > 4 && <span className="text-[9px] text-muted-foreground">+{e.tags.length - 4}</span>}
                    </div>
                  </td>
                  <td className="hidden p-2 text-xs sm:table-cell">{e.popularity}</td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(e.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-xs text-muted-foreground">Page {page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {/* Create / Edit dialog */}
      {(creating || editing) && (
        <EntityForm
          entity={editing}
          categories={categories}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}

      {/* Bulk import */}
      <BulkImportDialog open={bulkOpen} onClose={() => setBulkOpen(false)} onDone={load} categories={categories} />

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete entity?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove the entity and its tag associations.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EntityForm({
  entity,
  categories,
  onClose,
  onSaved,
}: {
  entity: EntityItem | null;
  categories: CategoryOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(entity?.name ?? "");
  const [description, setDescription] = useState(entity?.description ?? "");
  const [categoryId, setCategoryId] = useState(entity?.category?.slug ?? categories[0]?.slug ?? "");
  const [subcategoryId, setSubcategoryId] = useState(entity?.subcategory?.slug ?? "");
  const [tags, setTags] = useState((entity?.tags ?? []).join(", "));
  const [difficulty, setDifficulty] = useState(String(entity?.difficulty ?? 1));
  const [popularity, setPopularity] = useState(String(entity?.popularity ?? 50));
  const [saving, setSaving] = useState(false);

  const cat = categories.find((c) => c.slug === categoryId);

  const handleSave = async () => {
    if (!name.trim() || !categoryId) {
      toast.error("Name and category required");
      return;
    }
    setSaving(true);
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      categoryId: cat?.id,
      subcategoryId: cat?.subcategories.find((s) => s.slug === subcategoryId)?.id ?? null,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      difficulty: Number(difficulty),
      popularity: Number(popularity),
    };
    const url = entity ? `/api/admin/entities/${entity.id}` : "/api/admin/entities";
    const method = entity ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(entity ? "Entity updated" : "Entity created");
      onSaved();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Failed to save");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entity ? "Edit Entity" : "New Entity"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Astronaut" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A short description" className="min-h-[60px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category *</Label>
              <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setSubcategoryId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subcategory</Label>
              <Select value={subcategoryId} onValueChange={setSubcategoryId}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {cat?.subcategories.map((s) => <SelectItem key={s.id} value={s.slug}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Tags (comma separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="healthcare, degree, indoor" />
            <p className="mt-1 text-xs text-muted-foreground">Tags power the question engine. Use shared vocabulary.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Difficulty (1-5)</Label>
              <Input type="number" min={1} max={5} value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
            </div>
            <div>
              <Label>Popularity (0-100)</Label>
              <Input type="number" min={0} max={100} value={popularity} onChange={(e) => setPopularity(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BulkImportDialog({
  open,
  onClose,
  onDone,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  categories: CategoryOpt[];
}) {
  const [json, setJson] = useState("");
  const [busy, setBusy] = useState(false);

  const sample = JSON.stringify(
    [
      {
        name: "Astronaut",
        category: "jobs",
        subcategory: "technology",
        description: "A space traveler.",
        tags: ["profession", "technology", "degree", "high_income", "uniform", "dangerous"],
        difficulty: 2,
        popularity: 80,
      },
    ],
    null,
    2
  );

  const handleImport = async () => {
    let parsed;
    try {
      parsed = JSON.parse(json);
    } catch {
      toast.error("Invalid JSON");
      return;
    }
    if (!Array.isArray(parsed)) {
      toast.error("JSON must be an array of entities");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/admin/bulk-import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entities: parsed }),
    });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      toast.success(`Imported ${d.created} entities (${d.skipped} skipped)`);
      setJson("");
      onClose();
      onDone();
    } else {
      toast.error("Import failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Entities</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Paste a JSON array. Each entity needs: name, category (slug: {categories.map((c) => c.slug).join(", ")}), tags[].
        </p>
        <Textarea
          value={json || sample}
          onChange={(e) => setJson(e.target.value)}
          className="min-h-[200px] font-mono text-xs"
          placeholder={sample}
        />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport} disabled={busy}>{busy ? "Importing..." : "Import"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

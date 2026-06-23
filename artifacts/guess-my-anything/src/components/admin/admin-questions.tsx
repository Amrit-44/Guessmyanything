"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface QuestionItem {
  id: string;
  text: string;
  tag: string;
  tagSlug: string;
  inverted: boolean;
  category: string | null;
  categoryId: string | null;
  timesAsked: number;
  successCount: number;
  failCount: number;
  isActive: boolean;
  effectiveness: number | null;
}

interface CategoryOpt {
  id: string;
  name: string;
  slug: string;
}

export function AdminQuestions() {
  const [items, setItems] = useState<QuestionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<CategoryOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<QuestionItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (search) params.set("search", search);
    fetch(`/api/admin/questions?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
        setPages(d.pages);
      })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    fetch("/api/admin/categories").then((r) => r.json()).then((d) => setCategories(d.categories));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/admin/questions/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Question deleted");
      setDeleteId(null);
      load();
    }
  };

  const toggleActive = async (q: QuestionItem) => {
    await fetch(`/api/admin/questions/${q.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !q.isActive }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreating(true)} className="gap-1">
          <Plus className="h-4 w-4" /> New Question
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">{total} questions</div>

      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs">
            <tr>
              <th className="p-2">Question</th>
              <th className="hidden p-2 md:table-cell">Tag</th>
              <th className="hidden p-2 sm:table-cell">Asked</th>
              <th className="hidden p-2 sm:table-cell">Eff.</th>
              <th className="p-2">Active</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground blink">LOADING</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No questions found</td></tr>
            ) : (
              items.map((q) => (
                <tr key={q.id} className="border-t border-border hover:bg-muted/20">
                  <td className="p-2">
                    <div className={q.inverted ? "italic text-muted-foreground" : ""}>{q.text}</div>
                    {q.inverted && <span className="text-[9px] text-muted-foreground">(inverted)</span>}
                  </td>
                  <td className="hidden p-2 md:table-cell">
                    <Badge variant="secondary" className="text-[9px]">{q.tag}</Badge>
                  </td>
                  <td className="hidden p-2 text-xs sm:table-cell">{q.timesAsked}</td>
                  <td className="hidden p-2 text-xs sm:table-cell">
                    {q.effectiveness !== null ? (
                      <span className={q.effectiveness >= 50 ? "neon-green" : "neon-pink"}>{q.effectiveness}%</span>
                    ) : "—"}
                  </td>
                  <td className="p-2">
                    <Switch checked={q.isActive} onCheckedChange={() => toggleActive(q)} />
                  </td>
                  <td className="p-2">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditing(q)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(q.id)}>
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

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-xs text-muted-foreground">Page {page} / {pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}

      {(creating || editing) && (
        <QuestionForm
          question={editing}
          categories={categories}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSaved={() => { setCreating(false); setEditing(null); load(); }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete question?</AlertDialogTitle>
            <AlertDialogDescription>This question will no longer be asked.</AlertDialogDescription>
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

function QuestionForm({
  question,
  categories,
  onClose,
  onSaved,
}: {
  question: QuestionItem | null;
  categories: CategoryOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [text, setText] = useState(question?.text ?? "");
  const [tag, setTag] = useState(question?.tag ?? "");
  const [categoryId, setCategoryId] = useState(question?.categoryId ?? "");
  const [inverted, setInverted] = useState(question?.inverted ?? false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!text.trim() || !tag.trim()) {
      toast.error("Text and tag required");
      return;
    }
    setSaving(true);
    const cat = categories.find((c) => c.id === categoryId);
    const body = {
      text: text.trim(),
      tag: tag.trim(),
      categoryId: cat?.id ?? null,
      inverted,
    };
    const url = question ? `/api/admin/questions/${question.id}` : "/api/admin/questions";
    const method = question ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(question ? "Question updated" : "Question created");
      onSaved();
    } else {
      const d = await res.json();
      toast.error(d.error ?? "Failed");
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{question ? "Edit Question" : "New Question"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Question text *</Label>
            <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Is it a real person?" />
          </div>
          <div>
            <Label>Tag (probes this property) *</Label>
            <Input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="real_person" />
            <p className="mt-1 text-xs text-muted-foreground">Entities with this tag gain score on &quot;Yes&quot;.</p>
          </div>
          <div>
            <Label>Category restriction</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Any category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Any category</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={inverted} onCheckedChange={setInverted} id="inv" />
            <Label htmlFor="inv">Inverted (Yes means entity does NOT have the tag)</Label>
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

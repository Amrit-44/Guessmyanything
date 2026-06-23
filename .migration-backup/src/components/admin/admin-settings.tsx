"use client";

import { useEffect, useState } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";

interface SettingItem {
  id: string;
  key: string;
  value: string;
  type: string;
  group: string;
  label: string | null;
}

const DEFAULTS: Record<string, string> = {
  weightYes: "15",
  weightProbably: "8",
  weightDontKnow: "0",
  weightProbablyNot: "8",
  weightNo: "15",
  initialScore: "100",
  minQuestions: "8",
  maxQuestions: "28",
  confidenceThreshold: "1.45",
  scoreGapThreshold: "55",
  candidatePoolSize: "200",
  maxGuesses: "3",
};

export function AdminSettings() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings);
        const map: Record<string, string> = {};
        for (const s of d.settings) map[s.key] = s.value;
        setValues(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (group: string) => {
    setSaving(true);
    const groupSettings = settings
      .filter((s) => s.group === group)
      .map((s) => ({ key: s.key, value: values[s.key] ?? s.value }));
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: groupSettings }),
    });
    setSaving(false);
    if (res.ok) toast.success(`${group} settings saved`);
    else toast.error("Failed to save");
  };

  const resetGame = () => {
    const next = { ...values };
    for (const k of Object.keys(DEFAULTS)) next[k] = DEFAULTS[k];
    setValues(next);
    toast.info("Defaults loaded — click Save to apply");
  };

  if (loading) return <div className="py-10 text-center text-muted-foreground blink">LOADING</div>;

  const gameSettings = settings.filter((s) => s.group === "game");
  const siteSettings = settings.filter((s) => s.group === "site");
  const seoSettings = settings.filter((s) => s.group === "seo");

  const numField = (s: SettingItem) => (
    <div key={s.key}>
      <Label>{s.label ?? s.key}</Label>
      <Input
        type="number"
        step="any"
        value={values[s.key] ?? s.value}
        onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
      />
    </div>
  );

  const strField = (s: SettingItem, textarea = false) => (
    <div key={s.key}>
      <Label>{s.label ?? s.key}</Label>
      {textarea ? (
        <Textarea
          value={values[s.key] ?? s.value}
          onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
          className="min-h-[70px]"
        />
      ) : (
        <Input
          value={values[s.key] ?? s.value}
          onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
        />
      )}
    </div>
  );

  return (
    <Tabs defaultValue="game">
      <TabsList className="mb-4">
        <TabsTrigger value="game">Game Engine</TabsTrigger>
        <TabsTrigger value="site">Site</TabsTrigger>
        <TabsTrigger value="seo">SEO</TabsTrigger>
      </TabsList>

      <TabsContent value="game">
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm" style={{ fontFamily: "var(--font-pixel)" }}>GAME ENGINE CONFIG</CardTitle>
              <Button variant="outline" size="sm" onClick={resetGame} className="gap-1">
                <RotateCcw className="h-3.5 w-3.5" /> Reset to defaults
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gameSettings.map((s) => (s.type === "number" ? numField(s) : strField(s)))}
            </div>
            <div className="mt-4">
              <Button onClick={() => handleSave("game")} disabled={saving} className="gap-1">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Game Settings"}
              </Button>
            </div>
            <div className="mt-4 rounded-sm border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <p className="mb-1 font-medium">How it works:</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>Answer weights adjust entity scores (Yes=+weight for matching tag, -weight for non-matching).</li>
                <li>Min questions: AI waits this long before its first guess.</li>
                <li>Confidence threshold: top score must reach initial × this value.</li>
                <li>Score gap: top minus second must exceed this for a confident guess.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="site">
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm" style={{ fontFamily: "var(--font-pixel)" }}>SITE SETTINGS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {siteSettings.map((s) => strField(s, s.key === "siteDescription"))}
            </div>
            <Button onClick={() => handleSave("site")} disabled={saving} className="mt-4 gap-1">
              <Save className="h-4 w-4" /> Save Site Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="seo">
        <Card className="pixel-card rounded-sm">
          <CardHeader>
            <CardTitle className="text-sm" style={{ fontFamily: "var(--font-pixel)" }}>SEO SETTINGS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seoSettings.map((s) => strField(s, s.key === "seoKeywords"))}
            </div>
            <Button onClick={() => handleSave("seo")} disabled={saving} className="mt-4 gap-1">
              <Save className="h-4 w-4" /> Save SEO Settings
            </Button>
            <div className="mt-4 rounded-sm border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              Meta tags, Open Graph, Twitter cards, JSON-LD schema, sitemap, and robots.txt are all auto-generated. These keywords populate the meta keywords and help tune descriptions.
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

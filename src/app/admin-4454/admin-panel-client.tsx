"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import { AdminPanel } from "@/components/admin/admin-panel";

interface Props {
  authenticated: boolean;
}

export function AdminPanelClient({ authenticated }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(authenticated);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLoggedIn(true);
        toast.success("Welcome, Admin!");
        // Reload to get the server-side cookie applied
        router.refresh();
      } else {
        toast.error(data.error || "Invalid credentials");
      }
    } catch {
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // Clear cookie by setting maxAge to 0
    document.cookie = "admin_session=; path=/; maxAge=0";
    setLoggedIn(false);
    setName("");
    setPassword("");
    toast.success("Logged out");
    router.refresh();
  };

  if (!loggedIn) {
    return (
      <div className="relative flex min-h-screen items-center justify-center">
        <div aria-hidden className="starfield" />
        <div aria-hidden className="pixel-grid fixed inset-0 z-0 pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm px-4">
          <div className="pixel-card rounded-sm p-6 sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-lg overflow-hidden border-2 border-gray-200">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <h1
                className="text-sm neon-pink sm:text-base"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                ADMIN ACCESS
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Enter your credentials to continue
              </p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="admin-name">Name</Label>
                <Input
                  id="admin-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter admin name"
                  className="h-11"
                  style={{ fontFamily: "var(--font-retro)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <div>
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-11"
                  style={{ fontFamily: "var(--font-retro)" }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <Button
                onClick={handleLogin}
                disabled={loading || !name || !password}
                className="pixel-btn w-full"
                style={{ fontFamily: "var(--font-pixel)" }}
              >
                {loading ? "AUTHENTICATING..." : "LOGIN"}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              ← BACK TO GAME
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Logout button overlay */}
      <div className="fixed right-4 top-3 z-50">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-1 text-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
      <AdminPanel onExit={() => router.push("/")} />
    </div>
  );
}

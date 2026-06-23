import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { AdminPanel } from "@/components/admin/admin-panel";

export default function AdminPage() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLoggedIn(true);
        toast.success("Welcome, Admin!");
      } else {
        toast.error(data.error || "Invalid credentials");
      }
    } catch {
      toast.error("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    document.cookie = "admin_session=; path=/; maxAge=0";
    setLoggedIn(false);
    setName("");
    setPassword("");
    toast.success("Logged out");
  };

  if (!loggedIn) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-sm px-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border-2 border-gray-200">
                <img src="/logo.png" alt="Logo" className="h-full w-full object-cover" />
              </div>
              <h1 className="text-base font-bold text-gray-900">ADMIN ACCESS</h1>
              <p className="mt-1 text-xs text-gray-500">Enter your credentials to continue</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="admin-name">Name</Label>
                <Input
                  id="admin-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter admin name"
                  className="h-11 rounded-xl"
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
                  className="h-11 rounded-xl"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                />
              </div>
              <Button
                onClick={handleLogin}
                disabled={loading || !name || !password}
                className="h-11 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
              >
                {loading ? "AUTHENTICATING..." : "LOGIN"}
              </Button>
            </div>
          </div>
          <div className="mt-4 text-center">
            <a href="/" className="text-xs text-gray-400 hover:text-gray-700">← Back to Game</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="fixed right-4 top-3 z-50">
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-xs">
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
      <AdminPanel onExit={() => setLocation("/")} />
    </div>
  );
}

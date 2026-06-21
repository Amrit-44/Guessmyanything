"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  BarChart3,
  Boxes,
  HelpCircle,
  GraduationCap,
  MessageSquare,
  Settings,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AdminDashboard } from "./admin-dashboard";
import { AdminAnalytics } from "./admin-analytics";
import { AdminEntities } from "./admin-entities";
import { AdminQuestions } from "./admin-questions";
import { AdminLearnings } from "./admin-learnings";
import { AdminFeedback } from "./admin-feedback";
import { AdminSettings } from "./admin-settings";

interface Props {
  onExit: () => void;
}

export function AdminPanel({ onExit }: Props) {
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b-2 border-primary/40 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onExit} className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to game</span>
            </Button>
            <div className="h-5 w-px bg-border" />
            <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-lg" />
            <h1
              className="text-sm neon-pink sm:text-base"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              ADMIN CONTROL
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3 py-5 sm:px-4 sm:py-6">
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <div className="mb-5 overflow-x-auto">
            <TabsList className="flex h-auto w-max gap-1 bg-muted/40 p-1">
              <TabsTrigger value="dashboard" className="gap-1.5 text-xs">
                <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" /> Analytics
              </TabsTrigger>
              <TabsTrigger value="entities" className="gap-1.5 text-xs">
                <Boxes className="h-3.5 w-3.5" /> Entities
              </TabsTrigger>
              <TabsTrigger value="questions" className="gap-1.5 text-xs">
                <HelpCircle className="h-3.5 w-3.5" /> Questions
              </TabsTrigger>
              <TabsTrigger value="learnings" className="gap-1.5 text-xs">
                <GraduationCap className="h-3.5 w-3.5" /> Learnings
              </TabsTrigger>
              <TabsTrigger value="feedback" className="gap-1.5 text-xs">
                <MessageSquare className="h-3.5 w-3.5" /> Feedback
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1.5 text-xs">
                <Settings className="h-3.5 w-3.5" /> Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <AdminDashboard />
          </TabsContent>
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>
          <TabsContent value="entities">
            <AdminEntities />
          </TabsContent>
          <TabsContent value="questions">
            <AdminQuestions />
          </TabsContent>
          <TabsContent value="learnings">
            <AdminLearnings />
          </TabsContent>
          <TabsContent value="feedback">
            <AdminFeedback />
          </TabsContent>
          <TabsContent value="settings">
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

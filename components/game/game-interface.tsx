"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Send,
  User,
  Sparkles,
  Menu,
  X,
  Sword,
  Backpack,
  History,
  BookOpen,
  RefreshCw,
  FileText,
} from "lucide-react";
import { processGameAction } from "@/app/actions/game-actions";
import { generateAdventureSummary } from "@/app/actions/summary-actions";
import type { Database } from "@/lib/database.types";
import SkillsDialog from "./skills-dialog";
import InventoryDialog from "./inventory-dialog";
import WorldAlerts from "./world-alerts";
import WorldHistoryDialog from "./world-history-dialog";
import AdventureSummaryDialog from "./adventure-summary-dialog";
import { useToast } from "@/hooks/use-toast";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Skill = Database["public"]["Tables"]["skills"]["Row"];

interface EquippedItem {
  id: string;
  is_equipped: boolean;
  equipment: {
    id: string;
    name: string;
    category: string;
    stat_modifiers: Record<string, number>;
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface GameInterfaceProps {
  profile: Profile;
  equippedItems: EquippedItem[];
  skills: Skill[];
  sessionId: string;
  initialMessages: Message[];
}

export default function GameInterface({
  profile,
  equippedItems,
  skills,
  sessionId,
  initialMessages,
}: GameInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [skillsDialogOpen, setSkillsDialogOpen] = useState(false);
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
  const [failedAction, setFailedAction] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const unlockedRegions = ["Eryndor"]; // Everyone starts with Eryndor
  if (profile.level >= 5) unlockedRegions.push("Skaldor Peaks");
  if (profile.level >= 10) unlockedRegions.push("Valtheris Marshes");
  if (profile.level >= 15) unlockedRegions.push("Ashen Wastes");
  if (profile.level >= 20) unlockedRegions.push("Nytheris Isles");

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        role: "assistant",
        content: `A sudden storm engulfs the region of ${profile.current_location} within ${profile.current_region}. The people of the village were scrambling indoors to avoid the rain and thunder, caught offguard by the sudden change. \n\n Amidst this bustle, a blinding bolt of lightning strikes a nearby mountain range, followed by an illusion of a shattered sky. Soon after, the rain tempestuous weather calmed down as if had merely been raging in a fit of mischief. \n\nUnbeknownst to all, at the crater left by the lightning, a figure of a person slowly stood up from the ground, having descended anew to a grand new world of intrigue. A haunting whisper sounds in the ears of ${profile.display_name}: "Welcome to the realm of Eryndor!"`,
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const processAction = async (action: string) => {
    const userMessage: Message = {
      role: "user",
      content: action,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setFailedAction(null);

    try {
      const result = await processGameAction({
        action,
        sessionId,
        messages: [...messages, userMessage],
      });

      if (result.success && result.response) {
        const assistantMessage: Message = {
          role: "assistant",
          content: result.response,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        setFailedAction(action);
        const errorMessage: Message = {
          role: "assistant",
          content: result.error || "Something went wrong. Please try again.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("[v0] Error processing action:", error);
      setFailedAction(action);
      const errorMessage: Message = {
        role: "assistant",
        content: "An unexpected error occurred. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await processAction(input.trim());
  };

  const handleRetry = async () => {
    if (!failedAction || isLoading) return;
    await processAction(failedAction);
  };

  const handleSummarizeAdventure = async () => {
    setIsSummarizing(true);
    try {
      const result = await generateAdventureSummary();

      if (result.success) {
        toast({
          title: "Adventure Summarized!",
          description:
            "Your adventure has been summarized to optimize AI context.",
        });
        setSummaryDialogOpen(true);
      } else {
        toast({
          title: "Summary Failed",
          description: result.error || "Failed to generate summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("[v0] Error summarizing adventure:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <WorldAlerts
        currentRegion={profile.current_region}
        unlockedRegions={unlockedRegions}
      />

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen
            ? "lg:w-80 left-1 lg:left-0"
            : "lg:w-0 -left-full lg:left-0"
        } transition-all w-80 lg:max-w-80 rounded-xl top-1 lg:top-0 lg:rounded-none absolute bg-white z-100 lg:relative duration-300 border border-border overflow-hidden`}
      >
        <div className="p-6 space-y-6">
          <div className="items-end justify-end flex flex-col">
            <h2 className="text-2xl font-bold">{profile.display_name}</h2>
            <p className="text-sm text-muted-foreground">
              Level {profile.level} Adventurer
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold">Location</h3>
            <p className="text-sm text-muted-foreground">
              {profile.current_location}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.current_region}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold">Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Level:</span>{" "}
                {profile.level}
              </div>
              <div>
                <span className="text-muted-foreground">XP:</span>{" "}
                {profile.experience}
              </div>
              <div>
                <span className="text-muted-foreground">Skill Slots:</span>{" "}
                {profile.skill_slots}
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Skills</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSkillsDialogOpen(true)}
              >
                <Sword className="h-4 w-4 mr-1" />
                Manage
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {skills.length}/{profile.skill_slots} slots used
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Equipment</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInventoryDialogOpen(true)}
              >
                <Backpack className="h-4 w-4 mr-1" />
                Inventory
              </Button>
            </div>
            {equippedItems.length > 0 ? (
              <div className="space-y-2">
                {equippedItems.slice(0, 3).map((item) => (
                  <div key={item.id} className="text-sm">
                    <Badge variant="secondary" className="text-xs">
                      {item.equipment.category}
                    </Badge>
                    <p className="mt-1 truncate">{item.equipment.name}</p>
                  </div>
                ))}
                {equippedItems.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{equippedItems.length - 3} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No items equipped</p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setHistoryDialogOpen(true)}
            >
              <History className="h-4 w-4 mr-2" />
              World History
            </Button>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => setSummaryDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              View Summary
            </Button>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={handleSummarizeAdventure}
              disabled={isSummarizing || messages.length < 5}
            >
              {isSummarizing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <BookOpen className="h-4 w-4 mr-2" />
              )}
              Summarize Adventure
            </Button>
            {messages.length < 5 && (
              <p className="text-xs text-muted-foreground text-center">
                Play more to unlock summary
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="z-200"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
            <h1 className="text-xl font-semibold">World of Eryndor</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => (window.location.href = "/")}
          >
            Exit Game
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          <div className="space-y-4 max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <Card
                  className={`max-w-2xl py-0 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </CardContent>
                </Card>
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <Card>
                  <CardContent className="p-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            {failedAction && !isLoading && (
              <div className="mb-2 flex items-center justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="text-xs bg-transparent"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry last action
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What do you do? (e.g., 'I explore the village' or 'I talk to the blacksmith')"
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <SkillsDialog
        open={skillsDialogOpen}
        onOpenChange={setSkillsDialogOpen}
        skills={skills}
        availableSlots={profile.skill_slots}
      />

      <InventoryDialog
        open={inventoryDialogOpen}
        onOpenChange={setInventoryDialogOpen}
      />

      <WorldHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        unlockedRegions={unlockedRegions}
      />

      <AdventureSummaryDialog
        open={summaryDialogOpen}
        onOpenChange={setSummaryDialogOpen}
      />
    </div>
  );
}

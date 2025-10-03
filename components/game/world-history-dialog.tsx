"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Globe } from "lucide-react";
import {
  getWorldHistory,
  getWorldHistoryByRegion,
} from "@/app/actions/world-history-actions";
import type { Database } from "@/lib/database.types";

type WorldChange = Database["public"]["Tables"]["world_changes"]["Row"];

interface WorldHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unlockedRegions: string[];
}

export default function WorldHistoryDialog({
  open,
  onOpenChange,
  unlockedRegions,
}: WorldHistoryDialogProps) {
  const [allChanges, setAllChanges] = useState<WorldChange[]>([]);
  const [regionChanges, setRegionChanges] = useState<
    Record<string, WorldChange[]>
  >({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  useEffect(() => {
    if (open) {
      loadWorldHistory();
    }
  }, [open]);

  const loadWorldHistory = async () => {
    setIsLoading(true);
    try {
      // Load all changes
      const allResult = await getWorldHistory(100);
      if (allResult.success && allResult.changes) {
        setAllChanges(allResult.changes);
      }

      // Load changes by region for unlocked regions
      const regionData: Record<string, WorldChange[]> = {};
      for (const region of unlockedRegions) {
        const regionResult = await getWorldHistoryByRegion(region, 50);
        if (regionResult.success && regionResult.changes) {
          regionData[region] = regionResult.changes;
        }
      }
      setRegionChanges(regionData);
    } catch (error) {
      console.error("[v0] Error loading world history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderChanges = (changes: WorldChange[]) => {
    if (changes.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No world changes recorded yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {changes.map((change) => (
          <Card key={change.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{change.region}</Badge>
                    <Badge variant="secondary">{change.location}</Badge>
                    <span className="text-xs text-muted-foreground">
                      by {change.changed_by_player_name}
                    </span>
                  </div>
                  <p className="text-sm">{change.change_summary}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDate(change.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>World History</DialogTitle>
          <DialogDescription>
            View the chronicle of changes made by adventurers across the world
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs value={selectedRegion} onValueChange={setSelectedRegion}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">All Regions</TabsTrigger>
              {unlockedRegions.map((region) => (
                <TabsTrigger key={region} value={region}>
                  {region}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[400px] pr-4">
                {renderChanges(allChanges)}
              </ScrollArea>
            </TabsContent>

            {unlockedRegions.map((region) => (
              <TabsContent key={region} value={region} className="mt-4">
                <ScrollArea className="h-[400px] pr-4">
                  {renderChanges(regionChanges[region] || [])}
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

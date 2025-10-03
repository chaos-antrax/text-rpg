"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getUnseenAlerts,
  markAlertAsSeen,
} from "@/app/actions/world-alerts-actions";

interface WorldChange {
  id: string;
  region: string;
  location: string;
  change_summary: string;
  changed_by_player_name: string;
  created_at: string;
}

interface WorldAlertsProps {
  currentRegion: string;
  unlockedRegions: string[];
}

export default function WorldAlerts({
  currentRegion,
  unlockedRegions,
}: WorldAlertsProps) {
  const [alerts, setAlerts] = useState<WorldChange[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();

    // Subscribe to world_changes table for real-time updates
    const channel = supabase
      .channel("world_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "world_changes",
        },
        async (payload) => {
          const newChange = payload.new as WorldChange;

          // Only show alerts for regions the player has unlocked
          if (unlockedRegions.includes(newChange.region)) {
            setAlerts((prev) => [newChange, ...prev].slice(0, 5));
            setTimeout(() => {
              dismissAlert(newChange.id);
            }, 5000);
          }
        }
      )
      .subscribe();

    // Load unseen changes on mount
    loadUnseenChanges();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unlockedRegions]);

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    alerts.forEach((alert) => {
      if (!dismissedIds.has(alert.id)) {
        const timer = setTimeout(() => {
          dismissAlert(alert.id);
        }, 5000);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [alerts]);

  const loadUnseenChanges = async () => {
    const result = await getUnseenAlerts(unlockedRegions);

    if (result.success && result.alerts) {
      setAlerts(result.alerts);
    }
  };

  const dismissAlert = async (id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    await markAlertAsSeen(id);
  };

  const visibleAlerts = alerts.filter((alert) => !dismissedIds.has(alert.id));

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {visibleAlerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-primary shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Globe className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm">World Change</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {alert.location}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.region}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {alert.change_summary}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Changed by {alert.changed_by_player_name}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

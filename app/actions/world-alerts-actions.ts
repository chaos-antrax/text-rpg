"use server";

import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type WorldChange = Database["public"]["Tables"]["world_changes"]["Row"];

interface GetUnseenAlertsResult {
  success: boolean;
  alerts?: WorldChange[];
  error?: string;
}

export async function getUnseenAlerts(
  unlockedRegions: string[]
): Promise<GetUnseenAlertsResult> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get world changes from the last hour for unlocked regions
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: allChanges, error: changesError } = await supabase
      .from("world_changes")
      .select("*")
      .in("region", unlockedRegions)
      .gte("created_at", oneHourAgo)
      .order("created_at", { ascending: false });

    if (changesError) {
      return { success: false, error: changesError.message };
    }

    if (!allChanges || allChanges.length === 0) {
      return { success: true, alerts: [] };
    }

    // Get the IDs of changes this player has already seen
    const { data: seenChanges, error: seenError } = await supabase
      .from("seen_world_changes")
      .select("world_change_id")
      .eq("player_id", user.id)
      .in(
        "world_change_id",
        allChanges.map((c) => c.id)
      );

    if (seenError) {
      return { success: false, error: seenError.message };
    }

    const seenIds = new Set(seenChanges?.map((s) => s.world_change_id) || []);

    // Filter out seen changes
    const unseenAlerts = allChanges
      .filter((change) => !seenIds.has(change.id))
      .slice(0, 5);

    return { success: true, alerts: unseenAlerts };
  } catch (error) {
    console.error("[v0] Error fetching unseen alerts:", error);
    return { success: false, error: "Failed to fetch alerts" };
  }
}

export async function markAlertAsSeen(
  worldChangeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase.from("seen_world_changes").insert({
      player_id: user.id,
      world_change_id: worldChangeId,
    });

    if (error) {
      // Ignore unique constraint violations (already marked as seen)
      if (error.code === "23505") {
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[v0] Error marking alert as seen:", error);
    return { success: false, error: "Failed to mark alert as seen" };
  }
}

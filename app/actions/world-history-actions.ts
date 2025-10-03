"use server";

import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type WorldChange = Database["public"]["Tables"]["world_changes"]["Row"];

export interface WorldHistoryResult {
  success: boolean;
  changes?: WorldChange[];
  error?: string;
}

export async function getWorldHistory(limit = 50): Promise<WorldHistoryResult> {
  try {
    const supabase = await createServerClient();

    const { data: changes, error } = await supabase
      .from("world_changes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[v0] Error fetching world history:", error);
      return { success: false, error: "Failed to fetch world history" };
    }

    return { success: true, changes: changes || [] };
  } catch (error) {
    console.error("[v0] Unexpected error fetching world history:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getWorldHistoryByRegion(
  region: string,
  limit = 50
): Promise<WorldHistoryResult> {
  try {
    const supabase = await createServerClient();

    const { data: changes, error } = await supabase
      .from("world_changes")
      .select("*")
      .eq("region", region)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[v0] Error fetching world history by region:", error);
      return { success: false, error: "Failed to fetch world history" };
    }

    return { success: true, changes: changes || [] };
  } catch (error) {
    console.error(
      "[v0] Unexpected error fetching world history by region:",
      error
    );
    return { success: false, error: "An unexpected error occurred" };
  }
}

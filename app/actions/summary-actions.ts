"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function generateAdventureSummary() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Fetch player profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Fetch recent messages (last 50 messages for context)
    const { data: messages } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("player_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!messages || messages.length === 0) {
      return { success: false, error: "No adventure history to summarize" };
    }

    // Reverse to get chronological order
    const chronologicalMessages = messages.reverse();

    // Build prompt for AI to summarize
    const summaryPrompt = `You are summarizing a player's adventure in a text-based RPG. Below is their recent conversation history. Create a concise but comprehensive summary that captures:
1. Key events and accomplishments
2. Important NPCs they've met
3. Locations they've visited
4. Current quest or objective
5. Character progression highlights

Keep the summary under 500 words but include all important details that would help continue the story coherently.

PLAYER INFO:
- Name: ${profile.display_name}
- Level: ${profile.level}
- Current Location: ${profile.current_location}, ${profile.current_region}

RECENT ADVENTURE:
${chronologicalMessages
  .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
  .join("\n\n")}

Provide a narrative summary of this adventure:`;

    // Call OpenRouter AI
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

    if (!OPENROUTER_API_KEY) {
      return { success: false, error: "AI service not configured" };
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://v0.app",
          "X-Title": "Eryndor RPG",
        },
        body: JSON.stringify({
          model: "x-ai/grok-4-fast:free",
          messages: [
            {
              role: "user",
              content: summaryPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] OpenRouter API error:", errorText);
      return { success: false, error: "Failed to generate summary" };
    }

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || "";

    if (!summary) {
      return { success: false, error: "Failed to generate summary" };
    }

    // Save summary to database
    await supabase
      .from("profiles")
      .update({
        adventure_summary: summary,
        last_summary_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    revalidatePath("/game");

    return {
      success: true,
      summary,
    };
  } catch (error) {
    console.error("[v0] Error generating adventure summary:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function getAdventureSummary() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("adventure_summary, last_summary_at")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    return {
      success: true,
      summary: profile.adventure_summary,
      lastSummaryAt: profile.last_summary_at,
    };
  } catch (error) {
    console.error("[v0] Error fetching adventure summary:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

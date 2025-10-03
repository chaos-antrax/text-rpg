"use server";

import { createClient } from "@/lib/supabase/server";

export async function getMessageHistory(sessionId: string) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated", messages: [] };
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[v0] Error fetching messages:", error);
      return { success: false, error: error.message, messages: [] };
    }

    return {
      success: true,
      messages: messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
        timestamp: msg.created_at,
      })),
    };
  } catch (error) {
    console.error("[v0] Error in getMessageHistory:", error);
    return { success: false, error: "Failed to fetch messages", messages: [] };
  }
}

export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase.from("messages").insert({
      player_id: user.id,
      session_id: sessionId,
      role,
      content,
    });

    if (error) {
      console.error("[v0] Error saving message:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[v0] Error in saveMessage:", error);
    return { success: false, error: "Failed to save message" };
  }
}

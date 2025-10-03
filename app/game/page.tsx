import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GameInterface from "@/components/game/game-interface";
import { getMessageHistory } from "@/app/actions/message-actions";

export default async function GamePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth/login");
  }

  // Fetch player profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/auth/error?error=Profile not found");
  }

  // Fetch player's equipped items
  const { data: inventory } = await supabase
    .from("player_inventory")
    .select(
      `
      id,
      is_equipped,
      equipment:equipment_id (
        id,
        name,
        category,
        stat_modifiers
      )
    `
    )
    .eq("player_id", user.id)
    .eq("is_equipped", true);

  // Fetch player's skills
  const { data: skills } = await supabase
    .from("skills")
    .select("*")
    .eq("player_id", user.id)
    .order("slot_number");

  // Fetch or create game session
  let { data: session } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("player_id", user.id)
    .order("last_activity_at", { ascending: false })
    .limit(1)
    .single();

  if (!session) {
    const { data: newSession } = await supabase
      .from("game_sessions")
      .insert({
        player_id: user.id,
      })
      .select()
      .single();
    session = newSession;
  }

  const messageHistory = await getMessageHistory(session?.id || "");

  return (
    <GameInterface
      profile={profile}
      equippedItems={inventory || []}
      skills={skills || []}
      sessionId={session?.id || ""}
      initialMessages={messageHistory.messages}
    />
  );
}
